import bcrypt from 'bcryptjs';
import prisma from '../../config/database.js';
import config from '../../config/env.js';
import { ROLE_KEYS } from '../../constants/roles.js';
import { generateTempPassword } from '../../utils/password.js';
import { sendPlatformStaffInvite } from '../shared/mailService.js';

const PLATFORM_ROLE_KEYS = [ROLE_KEYS.SUPER_ADMIN, ROLE_KEYS.SUPER_ADMIN_STAFF];

function mapRow(row) {
  return {
    id: row.id,
    userId: row.userId,
    email: row.user.email,
    name: row.user.name,
    role: row.role.key,
    roleName: row.role.name,
    requireEmailOtp: row.requireEmailOtp,
    locked: row.role.key === ROLE_KEYS.SUPER_ADMIN,
    createdAt: row.createdAt,
  };
}

export async function listPlatformUsers() {
  const rows = await prisma.platformUser.findMany({
    include: {
      user: true,
      role: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return rows.map(mapRow);
}

export async function listPlatformRoles() {
  const rows = await prisma.role.findMany({
    where: { scope: 'platform', key: { in: PLATFORM_ROLE_KEYS } },
    orderBy: { key: 'asc' },
  });
  return rows.map((row) => ({
    id: row.id,
    key: row.key,
    name: row.name,
  }));
}

export async function createPlatformUser({
  name,
  email,
  roleKey = ROLE_KEYS.SUPER_ADMIN_STAFF,
  requireEmailOtp = false,
}) {
  if (!name || !email) {
    const err = new Error('name and email are required');
    err.status = 400;
    throw err;
  }

  const key = String(roleKey || ROLE_KEYS.SUPER_ADMIN_STAFF);
  if (key === ROLE_KEYS.SUPER_ADMIN) {
    const err = new Error('Cannot create another Super Admin here');
    err.status = 400;
    throw err;
  }
  if (!PLATFORM_ROLE_KEYS.includes(key)) {
    const err = new Error('Invalid platform role');
    err.status = 400;
    throw err;
  }

  const role = await prisma.role.findUnique({ where: { key } });
  if (!role || role.scope !== 'platform') {
    const err = new Error('Platform role missing — run seed');
    err.status = 500;
    throw err;
  }

  const normalized = String(email).toLowerCase().trim();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalized },
  });
  if (existingUser) {
    const already = await prisma.platformUser.findUnique({
      where: { userId: existingUser.id },
    });
    if (already) {
      const err = new Error('User already has platform access');
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

    return tx.platformUser.create({
      data: {
        userId: user.id,
        roleId: role.id,
        requireEmailOtp: Boolean(requireEmailOtp),
      },
      include: { user: true, role: true },
    });
  });

  const mail = await sendPlatformStaffInvite({
    to: normalized,
    staffName: name,
    email: normalized,
    password: tempPassword,
  });

  return {
    ...mapRow(created),
    invite: {
      emailed: mail.sent,
      temporaryPassword: mail.sent ? undefined : tempPassword,
    },
  };
}

export async function updatePlatformUser(
  platformUserId,
  { name, roleKey, requireEmailOtp }
) {
  const row = await prisma.platformUser.findUnique({
    where: { id: platformUserId },
    include: { user: true, role: true },
  });
  if (!row) {
    const err = new Error('Platform user not found');
    err.status = 404;
    throw err;
  }
  if (row.role.key === ROLE_KEYS.SUPER_ADMIN) {
    const err = new Error('Super Admin cannot be edited here');
    err.status = 400;
    throw err;
  }

  let roleId = row.roleId;
  if (roleKey && roleKey !== row.role.key) {
    if (roleKey === ROLE_KEYS.SUPER_ADMIN) {
      const err = new Error('Cannot promote to Super Admin here');
      err.status = 400;
      throw err;
    }
    const role = await prisma.role.findUnique({ where: { key: roleKey } });
    if (!role || role.scope !== 'platform') {
      const err = new Error('Invalid platform role');
      err.status = 400;
      throw err;
    }
    roleId = role.id;
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (name) {
      await tx.user.update({
        where: { id: row.userId },
        data: { name },
      });
    }
    return tx.platformUser.update({
      where: { id: platformUserId },
      data: {
        roleId,
        ...(requireEmailOtp === undefined
          ? {}
          : { requireEmailOtp: Boolean(requireEmailOtp) }),
      },
      include: { user: true, role: true },
    });
  });

  return mapRow(updated);
}

export async function deletePlatformUser(platformUserId) {
  const row = await prisma.platformUser.findUnique({
    where: { id: platformUserId },
    include: { role: true },
  });
  if (!row) {
    const err = new Error('Platform user not found');
    err.status = 404;
    throw err;
  }
  if (row.role.key === ROLE_KEYS.SUPER_ADMIN) {
    const err = new Error('Super Admin cannot be deleted');
    err.status = 400;
    throw err;
  }

  await prisma.platformUser.delete({ where: { id: platformUserId } });
  return { ok: true };
}

export async function setRequireEmailOtp(platformUserId, requireEmailOtp) {
  const existing = await prisma.platformUser.findUnique({
    where: { id: platformUserId },
    include: { role: true },
  });
  if (!existing) {
    const err = new Error('Platform user not found');
    err.status = 404;
    throw err;
  }

  const row = await prisma.platformUser.update({
    where: { id: platformUserId },
    data: { requireEmailOtp: Boolean(requireEmailOtp) },
    include: { user: true, role: true },
  });

  return mapRow(row);
}
