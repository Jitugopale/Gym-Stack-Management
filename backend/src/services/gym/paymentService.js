import prisma from '../../config/database.js';

export async function listPayments(gymId) {
  return prisma.payment.findMany({
    where: { gymId },
    include: { member: true, plan: true },
    orderBy: { paidAt: 'desc' },
  });
}

/**
 * Ledger-only payment (FitPlus-style). Does NOT extend membership dates.
 * Use POST /members/:id/renew to pay for the next plan period.
 */
export async function createPayment(gymId, data) {
  const member = await prisma.member.findFirst({
    where: { id: data.memberId, gymId },
    include: { plan: true },
  });
  if (!member) {
    const err = new Error('Member not found');
    err.status = 404;
    throw err;
  }

  const planId = data.planId || member.planId || null;
  let amount = data.amount;
  if (amount == null || amount === '') {
    amount = member.plan?.price;
  }
  if (amount == null || Number.isNaN(Number(amount))) {
    const err = new Error('amount is required');
    err.status = 400;
    throw err;
  }

  return prisma.payment.create({
    data: {
      gymId,
      memberId: data.memberId,
      planId,
      amount: Number(amount),
      method: data.method || 'cash',
      note: data.note || null,
      paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
    },
    include: { member: true, plan: true },
  });
}

export async function gymDashboard(gymId) {
  const [members, plans, paymentAgg, recentPayments] = await Promise.all([
    prisma.member.count({ where: { gymId } }),
    prisma.membershipPlan.count({ where: { gymId, isActive: true } }),
    prisma.payment.aggregate({
      where: { gymId },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.findMany({
      where: { gymId },
      take: 5,
      orderBy: { paidAt: 'desc' },
      include: { member: true },
    }),
  ]);

  return {
    members,
    activePlans: plans,
    payments: paymentAgg._count,
    revenue: paymentAgg._sum.amount || 0,
    recentPayments,
  };
}
