import bcrypt from 'bcryptjs';
import prisma from '../../config/database.js';
import config from '../../config/env.js';
import { generateTempPassword } from '../../utils/password.js';
import { sendGymStaffInvite } from '../shared/mailService.js';
import { ROLE_KEYS } from '../../constants/roles.js';

export async function listStaff(gymId) {
  const rows = await prisma.gymUser.findMany({
    where: { gymId },
    include: { user: true, role: true },
    orderBy: { createdAt: 'asc' },
  });

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    role: row.role.key,
    name: row.user.name,
    email: row.user.email,
    requireEmailOtp: row.requireEmailOtp,
    createdAt: row.createdAt,
  }));
}

export async function createStaff(gymId, { name, email }) {
  if (!name || !email) {
    const err = new Error('name and email are required');
    err.status = 400;
    throw err;
  }

  const gym = await prisma.gym.findUnique({ where: { id: gymId } });
  if (!gym) {
    const err = new Error('Gym not found');
    err.status = 404;
    throw err;
  }

  const staffRole = await prisma.role.findUnique({
    where: { key: ROLE_KEYS.GYM_STAFF },
  });
  if (!staffRole) {
    const err = new Error('gym_staff role missing — run seed');
    err.status = 500;
    throw err;
  }

  const normalized = String(email).toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalized },
  });
  if (existingUser) {
    const already = await prisma.gymUser.findUnique({
      where: { userId_gymId: { userId: existingUser.id, gymId } },
    });
    if (already) {
      const err = new Error('User already on this gym');
      err.status = 409;
      throw err;
    }
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, config.bcryptRounds);

  const created = await prisma.$transaction(async (tx) => {
    const user =
      existingUser ||
      (await tx.user.create({
        data: { email: normalized, name, passwordHash },
      }));

    if (existingUser) {
      await tx.user.update({
        where: { id: existingUser.id },
        data: { name, passwordHash },
      });
    }

    return tx.gymUser.create({
      data: {
        userId: user.id,
        gymId,
        roleId: staffRole.id,
        // Staff never get 2FA by default (FitPlus-style)
        requireEmailOtp: false,
      },
      include: { user: true, role: true },
    });
  });

  const mail = await sendGymStaffInvite({
    to: normalized,
    staffName: name,
    gymName: gym.name,
    slug: gym.slug,
    email: normalized,
    password: tempPassword,
  });

  return {
    id: created.id,
    userId: created.userId,
    role: created.role.key,
    name: created.user.name,
    email: created.user.email,
    requireEmailOtp: created.requireEmailOtp,
    invite: {
      emailed: mail.sent,
      temporaryPassword: mail.sent ? undefined : tempPassword,
    },
  };
}

export async function setStaffRequireEmailOtp(gymId, gymUserId, requireEmailOtp) {
  const row = await prisma.gymUser.findFirst({
    where: { id: gymUserId, gymId },
    include: { role: true, user: true },
  });
  if (!row) {
    const err = new Error('Staff not found');
    err.status = 404;
    throw err;
  }
  if (row.role.key === ROLE_KEYS.GYM_STAFF && requireEmailOtp) {
    const err = new Error('Staff accounts cannot enable 2FA');
    err.status = 400;
    throw err;
  }

  const updated = await prisma.gymUser.update({
    where: { id: gymUserId },
    data: { requireEmailOtp: Boolean(requireEmailOtp) },
    include: { user: true, role: true },
  });

  if (updated.role.key === ROLE_KEYS.GYM_OWNER) {
    await prisma.gym.update({
      where: { id: gymId },
      data: { requireOwner2fa: Boolean(requireEmailOtp) },
    });
  }

  return {
    id: updated.id,
    userId: updated.userId,
    role: updated.role.key,
    name: updated.user.name,
    email: updated.user.email,
    requireEmailOtp: updated.requireEmailOtp,
  };
}

export async function deleteStaff(gymId, gymUserId) {
  const row = await prisma.gymUser.findFirst({
    where: { id: gymUserId, gymId },
    include: { role: true },
  });
  if (!row) {
    const err = new Error('Staff not found');
    err.status = 404;
    throw err;
  }
  if (row.role.key === ROLE_KEYS.GYM_OWNER) {
    const err = new Error('Cannot remove gym owner');
    err.status = 400;
    throw err;
  }
  await prisma.gymUser.delete({ where: { id: row.id } });
  return { ok: true };
}
