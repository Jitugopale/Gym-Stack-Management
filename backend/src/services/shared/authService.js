import bcrypt from 'bcryptjs';
import prisma from '../../config/database.js';
import config from '../../config/env.js';
import { signAdminToken, signGymToken } from '../../utils/jwt.js';
import {
  permissionsFromRole,
  resolveGymPermissions,
} from '../../utils/permissions.js';
import { ROLE_KEYS } from '../../constants/roles.js';
import { catalogFeaturesForGym } from '../../constants/gym.js';
import { createEmailChallenge, verifyEmailChallenge } from './otpService.js';
import { rejectIfGymLoginBlocked } from '../../middleware/gymAccess.js';

const roleInclude = {
  role: {
    include: {
      rolePermissions: { include: { permission: true } },
    },
  },
};

function publicUser(user, extras = {}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    ...extras,
  };
}

async function assertPassword(user, password) {
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
}

function adminSession(user, platformUser) {
  const permissions = permissionsFromRole(platformUser.role);
  const token = signAdminToken({ userId: user.id, realm: 'admin' });
  return {
    token,
    user: publicUser(user, {
      role: platformUser.role.key,
      permissions,
      realm: 'admin',
      requireEmailOtp: Boolean(platformUser.requireEmailOtp),
    }),
  };
}

function gymSession(user, gymUser, gym) {
  const toggles = gym.featureToggles || [];
  const permissions = resolveGymPermissions(gymUser.role, toggles);
  const token = signGymToken({
    userId: user.id,
    gymId: gym.id,
    realm: 'gym',
  });
  return {
    token,
    user: publicUser(user, {
      role: gymUser.role.key,
      permissions,
      features: catalogFeaturesForGym(toggles),
      realm: 'gym',
      gymId: gym.id,
      gymSlug: gym.slug,
      gymName: gym.name,
      requireEmailOtp: Boolean(gymUser.requireEmailOtp),
      requireOwner2fa: gym.requireOwner2fa,
      gymStatus: gym.status,
      periodEndsAt: gym.periodEndsAt,
    }),
  };
}

/** FitPlus-style: per GymUser.requireEmailOtp flag (staff usually false). */
function gymNeeds2fa(gymUser) {
  return Boolean(gymUser.requireEmailOtp);
}

export async function adminLogin(email, password) {
  const user = await prisma.user.findUnique({
    where: { email: String(email).toLowerCase() },
    include: { platformUser: { include: roleInclude } },
  });

  if (!user?.platformUser) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  await assertPassword(user, password);

  if (user.platformUser.requireEmailOtp) {
    return createEmailChallenge({
      userId: user.id,
      email: user.email,
      realm: 'admin',
    });
  }

  return adminSession(user, user.platformUser);
}

export async function adminVerify2fa({ email, challengeId, otp }) {
  const user = await prisma.user.findUnique({
    where: { email: String(email).toLowerCase() },
    include: { platformUser: { include: roleInclude } },
  });
  if (!user?.platformUser) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }

  await verifyEmailChallenge({
    challengeId,
    otp,
    userId: user.id,
    realm: 'admin',
  });

  return adminSession(user, user.platformUser);
}

export async function gymLogin(email, password, slug) {
  const gym = await prisma.gym.findUnique({
    where: { slug },
    include: { featureToggles: true },
  });
  if (!gym) {
    const err = new Error('Gym not found');
    err.status = 404;
    throw err;
  }

  rejectIfGymLoginBlocked(gym);

  const user = await prisma.user.findUnique({
    where: { email: String(email).toLowerCase() },
  });
  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const gymUser = await prisma.gymUser.findUnique({
    where: { userId_gymId: { userId: user.id, gymId: gym.id } },
    include: roleInclude,
  });
  if (!gymUser) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  await assertPassword(user, password);

  if (gymNeeds2fa(gymUser)) {
    return createEmailChallenge({
      userId: user.id,
      email: user.email,
      realm: 'gym',
      gymId: gym.id,
    });
  }

  return gymSession(user, gymUser, gym);
}

export async function gymVerify2fa({ email, slug, challengeId, otp }) {
  const gym = await prisma.gym.findUnique({
    where: { slug },
    include: { featureToggles: true },
  });
  if (!gym) {
    const err = new Error('Gym not found');
    err.status = 404;
    throw err;
  }

  const user = await prisma.user.findUnique({
    where: { email: String(email).toLowerCase() },
  });
  if (!user) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }

  const gymUser = await prisma.gymUser.findUnique({
    where: { userId_gymId: { userId: user.id, gymId: gym.id } },
    include: roleInclude,
  });
  if (!gymUser) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }

  await verifyEmailChallenge({
    challengeId,
    otp,
    userId: user.id,
    realm: 'gym',
  });

  return gymSession(user, gymUser, gym);
}

export async function adminMe(userId) {
  const platformUser = await prisma.platformUser.findUnique({
    where: { userId },
    include: { user: true, ...roleInclude },
  });
  if (!platformUser) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  return publicUser(platformUser.user, {
    role: platformUser.role.key,
    permissions: permissionsFromRole(platformUser.role),
    realm: 'admin',
    requireEmailOtp: Boolean(platformUser.requireEmailOtp),
  });
}

export async function gymMe(userId, gymId) {
  const gymUser = await prisma.gymUser.findUnique({
    where: { userId_gymId: { userId, gymId } },
    include: {
      user: true,
      gym: { include: { featureToggles: true } },
      ...roleInclude,
    },
  });
  if (!gymUser) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  const toggles = gymUser.gym.featureToggles || [];
  return publicUser(gymUser.user, {
    role: gymUser.role.key,
    permissions: resolveGymPermissions(gymUser.role, toggles),
    features: catalogFeaturesForGym(toggles),
    realm: 'gym',
    gymId: gymUser.gymId,
    gymSlug: gymUser.gym.slug,
    gymName: gymUser.gym.name,
    requireEmailOtp: Boolean(gymUser.requireEmailOtp),
    requireOwner2fa: gymUser.gym.requireOwner2fa,
    gymStatus: gymUser.gym.status,
    periodEndsAt: gymUser.gym.periodEndsAt,
  });
}

export { config };
