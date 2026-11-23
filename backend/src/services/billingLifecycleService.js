import prisma from '../config/database.js';
import {
  GYM_BILLING,
  GYM_STATUS,
} from '../constants/gym.js';
import { logger } from '../utils/logger.js';
import * as invoiceService from './admin/gymInvoiceService.js';

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * After period end unpaid:
 * days 1–7 grace → 8–14 soft_lock → 15+ login_blocked
 */
export async function resolveStatusFromPeriod(gym, asOf = new Date()) {
  if (!gym.periodEndsAt) {
    return { status: GYM_STATUS.ACTIVE, graceEndsAt: null, softLockEndsAt: null };
  }

  const periodEnd = new Date(gym.periodEndsAt);
  if (asOf <= periodEnd) {
    return {
      status: GYM_STATUS.ACTIVE,
      graceEndsAt: null,
      softLockEndsAt: null,
    };
  }

  const graceEndsAt = addDays(periodEnd, GYM_BILLING.GRACE_DAYS);
  const softLockEndsAt = addDays(graceEndsAt, GYM_BILLING.SOFT_LOCK_DAYS);

  if (asOf <= graceEndsAt) {
    return { status: GYM_STATUS.GRACE, graceEndsAt, softLockEndsAt };
  }
  if (asOf <= softLockEndsAt) {
    return { status: GYM_STATUS.SOFT_LOCK, graceEndsAt, softLockEndsAt };
  }
  return { status: GYM_STATUS.LOGIN_BLOCKED, graceEndsAt, softLockEndsAt };
}

export async function advanceGym(gymId) {
  const gym = await prisma.gym.findUnique({
    where: { id: gymId },
    include: { subscriptionPlan: true },
  });
  if (!gym) return null;

  const next = await resolveStatusFromPeriod(gym);
  if (next.status === gym.status) return gym;

  const updated = await prisma.gym.update({
    where: { id: gym.id },
    data: {
      status: next.status,
      graceEndsAt: next.graceEndsAt,
      softLockEndsAt: next.softLockEndsAt,
    },
  });

  if (
    (next.status === GYM_STATUS.GRACE || next.status === GYM_STATUS.SOFT_LOCK) &&
    gym.subscriptionPlanId
  ) {
    const pending = await prisma.gymInvoice.findFirst({
      where: { gymId: gym.id, status: 'pending' },
    });
    if (!pending) {
      await invoiceService.createRenewalInvoice(gym.id, {
        sendEmail: true,
      });
    }
  }

  logger.info(`Gym ${gym.slug} status → ${next.status}`);
  return updated;
}

export async function advanceAllGyms() {
  const gyms = await prisma.gym.findMany({ select: { id: true } });
  let changed = 0;
  for (const g of gyms) {
    const before = await prisma.gym.findUnique({ where: { id: g.id } });
    const after = await advanceGym(g.id);
    if (after && before && after.status !== before.status) changed += 1;
  }
  logger.info(`Billing advance complete: ${changed}/${gyms.length} status changes`);
  return { total: gyms.length, changed };
}

export async function markGymPaid(gymId, { paidAt = new Date() } = {}) {
  const gym = await prisma.gym.findUnique({
    where: { id: gymId },
    include: { subscriptionPlan: true },
  });
  if (!gym?.subscriptionPlan) {
    const err = new Error('Gym has no subscription plan');
    err.status = 400;
    throw err;
  }

  const months = gym.subscriptionPlan.durationMonths;
  const periodEndsAt = addDays(paidAt, months * 30);

  return prisma.gym.update({
    where: { id: gymId },
    data: {
      status: GYM_STATUS.ACTIVE,
      periodEndsAt,
      graceEndsAt: null,
      softLockEndsAt: null,
    },
  });
}

export default {
  resolveStatusFromPeriod,
  advanceGym,
  advanceAllGyms,
  markGymPaid,
};
