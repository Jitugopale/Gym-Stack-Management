import prisma from '../config/database.js';
import { verifyAdminToken, verifyGymToken } from '../utils/jwt.js';
import {
  permissionsFromRole,
  hasPermission,
  resolveGymPermissions,
} from '../utils/permissions.js';
import { AUTH_REALM } from '../constants/roles.js';
import { getAccessTokenFromRequest } from '../utils/cookies.js';

const roleInclude = {
  role: {
    include: {
      rolePermissions: { include: { permission: true } },
    },
  },
};

/**
 * JWT via realm HttpOnly cookie (preferred) or Authorization: Bearer.
 * Admin and gym use different secrets + cookie names — sessions cannot cross.
 */
export async function authenticateAdmin(req, res, next) {
  try {
    const token = getAccessTokenFromRequest(req, AUTH_REALM.ADMIN);
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = verifyAdminToken(token);
    const platformUser = await prisma.platformUser.findUnique({
      where: { userId: decoded.userId },
      include: { user: true, ...roleInclude },
    });

    if (!platformUser) return res.status(401).json({ message: 'Unauthorized' });

    req.user = platformUser.user;
    req.auth = {
      realm: AUTH_REALM.ADMIN,
      userId: platformUser.userId,
      user: platformUser.user,
      role: platformUser.role,
      roleKey: platformUser.role.key,
      roleScope: platformUser.role.scope,
      permissions: permissionsFromRole(platformUser.role),
    };
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

export async function authenticateGym(req, res, next) {
  try {
    const token = getAccessTokenFromRequest(req, AUTH_REALM.GYM);
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = verifyGymToken(token);
    const gymUser = await prisma.gymUser.findFirst({
      where: {
        userId: decoded.userId,
        gymId: decoded.gymId,
      },
      include: {
        user: true,
        gym: { include: { featureToggles: true } },
        ...roleInclude,
      },
    });

    if (!gymUser) return res.status(401).json({ message: 'Unauthorized' });

    req.user = gymUser.user;
    req.auth = {
      realm: AUTH_REALM.GYM,
      userId: gymUser.userId,
      user: gymUser.user,
      gymId: gymUser.gymId,
      gym: gymUser.gym,
      role: gymUser.role,
      roleKey: gymUser.role.key,
      roleScope: gymUser.role.scope,
      permissions: resolveGymPermissions(
        gymUser.role,
        gymUser.gym?.featureToggles || []
      ),
      features: gymUser.gym?.featureToggles || [],
    };
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

export function requirePermission(...keys) {
  return (req, res, next) => {
    const perms = req.auth?.permissions || [];
    if (!hasPermission(perms, keys)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}
