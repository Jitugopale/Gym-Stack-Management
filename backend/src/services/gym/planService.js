import prisma from '../../config/database.js';

export async function listPlans(gymId) {
  return prisma.membershipPlan.findMany({
    where: { gymId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createPlan(gymId, data) {
  return prisma.membershipPlan.create({
    data: {
      gymId,
      name: data.name,
      durationDays: Number(data.durationDays),
      price: data.price,
      isActive: data.isActive ?? true,
    },
  });
}

export async function updatePlan(gymId, id, data) {
  const existing = await prisma.membershipPlan.findFirst({ where: { id, gymId } });
  if (!existing) {
    const err = new Error('Plan not found');
    err.status = 404;
    throw err;
  }
  return prisma.membershipPlan.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.durationDays !== undefined && {
        durationDays: Number(data.durationDays),
      }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
}

export async function deletePlan(gymId, id) {
  const existing = await prisma.membershipPlan.findFirst({ where: { id, gymId } });
  if (!existing) {
    const err = new Error('Plan not found');
    err.status = 404;
    throw err;
  }
  await prisma.membershipPlan.delete({ where: { id } });
  return { ok: true };
}
