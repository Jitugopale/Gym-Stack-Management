import prisma from '../../config/database.js';
import {
  addDays,
  parseDateOnly,
  startOfDay,
  toDateOnlyString,
} from '../../utils/dateUtils.js';

const MEMBER_STATUSES = new Set(['active', 'frozen', 'expired', 'cancelled']);
const RESTART_MODES = new Set(['today', 'from_expiry', 'from_end', 'custom']);

async function syncExpired(gymId) {
  const today = startOfDay(new Date());
  await prisma.member.updateMany({
    where: {
      gymId,
      status: 'active',
      endDate: { lt: today },
    },
    data: { status: 'expired' },
  });
}

export async function listMembers(gymId, query = {}) {
  await syncExpired(gymId);

  const where = { gymId };
  if (query.status) where.status = String(query.status);
  if (query.planId) where.planId = String(query.planId);

  const expiringIn = Number(query.expiringIn);
  if (expiringIn > 0) {
    const today = startOfDay(new Date());
    where.status = where.status || 'active';
    where.endDate = {
      gte: today,
      lte: addDays(today, expiringIn),
    };
  }

  return prisma.member.findMany({
    where,
    include: { plan: true },
    orderBy: [{ endDate: 'asc' }, { createdAt: 'desc' }],
  });
}

async function loadPlan(gymId, planId, { requireActive = true } = {}) {
  if (!planId) return null;
  const plan = await prisma.membershipPlan.findFirst({
    where: {
      id: planId,
      gymId,
      ...(requireActive ? { isActive: true } : {}),
    },
  });
  if (!plan) {
    const err = new Error('Plan not found');
    err.status = 400;
    throw err;
  }
  return plan;
}

function periodFromPlan(plan, startDate) {
  const days = Number(plan.durationDays);
  if (!days || days < 1) {
    const err = new Error('Plan durationDays must be >= 1');
    err.status = 400;
    throw err;
  }
  return {
    startDate,
    endDate: addDays(startDate, days),
  };
}

function resolveRenewStart({ data, member, today }) {
  const oldEnd = member.endDate ? startOfDay(member.endDate) : null;
  const mode = String(data.startMode || '').toLowerCase();

  if (data.startDate) {
    return { startDate: parseDateOnly(data.startDate), mode: mode || 'custom' };
  }
  if (mode === 'from_expiry' || mode === 'from_end') {
    if (!oldEnd) {
      const err = new Error('No previous end date to continue from');
      err.status = 400;
      throw err;
    }
    return { startDate: addDays(oldEnd, 1), mode };
  }
  if (mode === 'today') {
    return { startDate: today, mode };
  }
  if (oldEnd && oldEnd > today) {
    // Advance renew — still has remaining days
    return { startDate: addDays(oldEnd, 1), mode: 'advance' };
  }
  return { startDate: today, mode: mode || 'today' };
}

export async function createMember(gymId, data) {
  if (!data.name) {
    const err = new Error('name is required');
    err.status = 400;
    throw err;
  }
  if (!data.planId) {
    const err = new Error('planId is required');
    err.status = 400;
    throw err;
  }

  const plan = await loadPlan(gymId, data.planId);
  const startDate = parseDateOnly(data.startDate || new Date());
  const endDate = data.endDate
    ? parseDateOnly(data.endDate)
    : periodFromPlan(plan, startDate).endDate;

  const member = await prisma.$transaction(async (tx) => {
    const created = await tx.member.create({
      data: {
        gymId,
        name: String(data.name).trim(),
        email: data.email || null,
        phone: data.phone || null,
        planId: plan.id,
        status: 'active',
        startDate,
        endDate,
      },
      include: { plan: true },
    });

    if (data.skipPayment !== true) {
      const amount = Number(
        data.amount != null && data.amount !== '' ? data.amount : plan.price
      );
      if (!Number.isFinite(amount) || amount < 0) {
        const err = new Error('Invalid payment amount');
        err.status = 400;
        throw err;
      }
      if (amount > 0) {
        await tx.payment.create({
          data: {
            gymId,
            memberId: created.id,
            planId: plan.id,
            amount,
            method: data.method || 'cash',
            note:
              data.note ||
              `New membership · ${plan.name} · ${plan.durationDays} days · from ${toDateOnlyString(startDate)}`,
            paidAt: new Date(),
          },
        });
      }
    }

    return created;
  });

  return prisma.member.findUnique({
    where: { id: member.id },
    include: { plan: true },
  });
}

/**
 * Advance renew: endDate still in future → start = endDate + 1.
 * Restart: startMode today | from_expiry | custom (+ optional startDate).
 * Period = start + plan.durationDays. Payment does not change dates by itself.
 */
export async function renewMember(gymId, id, data = {}) {
  const member = await prisma.member.findFirst({
    where: { id, gymId },
    include: { plan: true },
  });
  if (!member) {
    const err = new Error('Member not found');
    err.status = 404;
    throw err;
  }

  const planId = data.planId || member.planId;
  if (!planId) {
    const err = new Error('Select a membership plan to renew');
    err.status = 400;
    throw err;
  }
  // Current plan may be inactive; switching to another plan must be active
  const switchingPlan = Boolean(data.planId) && data.planId !== member.planId;
  const plan = await loadPlan(gymId, planId, { requireActive: switchingPlan });
  if (!plan) {
    const err = new Error('Select a membership plan to renew');
    err.status = 400;
    throw err;
  }

  const today = startOfDay(new Date());
  const { startDate, mode } = resolveRenewStart({ data, member, today });
  const { endDate } = periodFromPlan(plan, startDate);

  const amount = Number(data.amount ?? plan.price);
  if (!Number.isFinite(amount) || amount < 0) {
    const err = new Error('Invalid payment amount');
    err.status = 400;
    throw err;
  }

  const isRestart = RESTART_MODES.has(mode) || mode === 'custom';

  return prisma.$transaction(async (tx) => {
    const row = await tx.member.update({
      where: { id },
      data: {
        planId: plan.id,
        status: 'active',
        startDate,
        endDate,
      },
      include: { plan: true },
    });

    if (data.skipPayment !== true && amount > 0) {
      await tx.payment.create({
        data: {
          gymId,
          memberId: id,
          planId: plan.id,
          amount,
          method: data.method || 'cash',
          note:
            data.note ||
            `${isRestart ? 'Restart' : 'Renewal'} · ${plan.name} · ${plan.durationDays} days · from ${toDateOnlyString(startDate)}`,
          paidAt: new Date(),
        },
      });
    }

    return row;
  });
}

/**
 * FitPlus status rules:
 * - frozen: pause access; endDate unchanged
 * - cancelled: stop membership; endDate = today
 * - active (unfreeze): resume; if endDate already past → expired
 */
export async function updateMember(gymId, id, data) {
  const existing = await prisma.member.findFirst({ where: { id, gymId } });
  if (!existing) {
    const err = new Error('Member not found');
    err.status = 404;
    throw err;
  }

  if (data.status !== undefined && !MEMBER_STATUSES.has(data.status)) {
    const err = new Error('Invalid membership status');
    err.status = 400;
    throw err;
  }

  const patch = {
    ...(data.name !== undefined && { name: String(data.name).trim() }),
    ...(data.email !== undefined && { email: data.email || null }),
    ...(data.phone !== undefined && { phone: data.phone || null }),
    ...(data.planId !== undefined && { planId: data.planId || null }),
    ...(data.status !== undefined && { status: data.status }),
    ...(data.startDate !== undefined && {
      startDate: data.startDate ? parseDateOnly(data.startDate) : null,
    }),
    ...(data.endDate !== undefined && {
      endDate: data.endDate ? parseDateOnly(data.endDate) : null,
    }),
  };

  if (data.status === 'cancelled' && existing.status !== 'cancelled') {
    patch.endDate = startOfDay(new Date());
  }

  if (data.status === 'active' && existing.status === 'frozen') {
    const end = existing.endDate ? startOfDay(existing.endDate) : null;
    if (end && end < startOfDay(new Date())) {
      patch.status = 'expired';
    }
  }

  return prisma.member.update({
    where: { id },
    data: patch,
    include: { plan: true },
  });
}

export async function deleteMember(gymId, id) {
  const existing = await prisma.member.findFirst({ where: { id, gymId } });
  if (!existing) {
    const err = new Error('Member not found');
    err.status = 404;
    throw err;
  }
  await prisma.member.delete({ where: { id } });
  return { ok: true };
}
