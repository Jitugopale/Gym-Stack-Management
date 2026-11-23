import prisma from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import { sendGymInvoiceEmail } from '../shared/mailService.js';
import billingLifecycleService from '../billingLifecycleService.js';

function invoiceRef() {
  const n = Date.now().toString(36).toUpperCase();
  return `GS-${n}`;
}

export async function listInvoices(filters = {}) {
  return prisma.gymInvoice.findMany({
    where: {
      ...(filters.gymId && { gymId: filters.gymId }),
      ...(filters.status && { status: filters.status }),
    },
    include: {
      gym: true,
      plan: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createRenewalInvoice(gymId, { sendEmail = true } = {}) {
  const gym = await prisma.gym.findUnique({
    where: { id: gymId },
    include: {
      subscriptionPlan: true,
      gymUsers: {
        include: { user: true, role: true },
      },
    },
  });
  if (!gym) {
    const err = new Error('Gym not found');
    err.status = 404;
    throw err;
  }
  if (!gym.subscriptionPlan) {
    const err = new Error('Assign a subscription plan first');
    err.status = 400;
    throw err;
  }

  const existing = await prisma.gymInvoice.findFirst({
    where: { gymId, status: { in: ['pending', 'overdue'] } },
  });
  if (existing) return existing;

  const dueDate = gym.periodEndsAt
    ? new Date(gym.periodEndsAt)
    : new Date();
  const periodStart = gym.periodEndsAt
    ? new Date(gym.periodEndsAt)
    : new Date();
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + gym.subscriptionPlan.durationMonths);

  const invoice = await prisma.gymInvoice.create({
    data: {
      gymId,
      planId: gym.subscriptionPlan.id,
      invoiceRef: invoiceRef(),
      amount: gym.subscriptionPlan.priceInr,
      status: 'pending',
      dueDate,
      periodStart,
      periodEnd,
      note: 'Cloud subscription renewal',
    },
    include: { plan: true, gym: true },
  });

  if (sendEmail) {
    const owner = gym.gymUsers.find((gu) => gu.role.key === 'gym_owner');
    if (owner?.user?.email) {
      await sendGymInvoiceEmail({
        to: owner.user.email,
        gymName: gym.name,
        invoiceRef: invoice.invoiceRef,
        planName: gym.subscriptionPlan.name,
        amount: Number(invoice.amount),
        dueDate: invoice.dueDate,
      });
    } else {
      logger.warn(`No owner email for invoice ${invoice.invoiceRef}`);
    }
  }

  return invoice;
}

export async function markInvoicePaid(invoiceId) {
  const invoice = await prisma.gymInvoice.findUnique({
    where: { id: invoiceId },
    include: { gym: true, plan: true },
  });
  if (!invoice) {
    const err = new Error('Invoice not found');
    err.status = 404;
    throw err;
  }
  if (invoice.status === 'paid') return invoice;

  const paidAt = new Date();
  const updated = await prisma.gymInvoice.update({
    where: { id: invoiceId },
    data: { status: 'paid', paidAt },
    include: { gym: true, plan: true },
  });

  await billingLifecycleService.markGymPaid(invoice.gymId, { paidAt });
  logger.info(`Invoice ${invoice.invoiceRef} marked paid`);
  return updated;
}

export async function listSubscriptionPlans({ all = false } = {}) {
  return prisma.subscriptionPlan.findMany({
    where: all ? undefined : { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function createSubscriptionPlan(body) {
  const key = String(body.key || '').trim().toLowerCase();
  const name = String(body.name || '').trim();
  const durationMonths = Number(body.durationMonths);
  const priceInr = Number(body.priceInr);
  if (!key || !name || !durationMonths || Number.isNaN(priceInr)) {
    const err = new Error('key, name, durationMonths, priceInr required');
    err.status = 400;
    throw err;
  }
  const defaultFeatureKeys = Array.isArray(body.defaultFeatureKeys)
    ? body.defaultFeatureKeys.map(String)
    : [];

  return prisma.subscriptionPlan.create({
    data: {
      key,
      name,
      durationMonths,
      priceInr,
      sortOrder: Number(body.sortOrder) || 0,
      isActive: body.isActive !== false,
      defaultFeatureKeys,
    },
  });
}

export async function updateSubscriptionPlan(id, body) {
  const data = {};
  if (body.key != null) data.key = String(body.key).trim().toLowerCase();
  if (body.name != null) data.name = String(body.name).trim();
  if (body.durationMonths != null) data.durationMonths = Number(body.durationMonths);
  if (body.priceInr != null) data.priceInr = Number(body.priceInr);
  if (body.sortOrder != null) data.sortOrder = Number(body.sortOrder);
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
  if (Array.isArray(body.defaultFeatureKeys)) {
    data.defaultFeatureKeys = body.defaultFeatureKeys.map(String);
  }
  return prisma.subscriptionPlan.update({ where: { id }, data });
}

export async function deleteSubscriptionPlan(id) {
  const inUse = await prisma.gym.count({ where: { subscriptionPlanId: id } });
  if (inUse) {
    const err = new Error('Plan assigned to gyms — deactivate instead');
    err.status = 409;
    throw err;
  }
  await prisma.subscriptionPlan.delete({ where: { id } });
  return { id };
}
