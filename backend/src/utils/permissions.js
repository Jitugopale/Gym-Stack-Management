import { permissionsFromFeatureToggles } from '../constants/gym.js';

export function permissionsFromRole(role) {
  if (!role?.rolePermissions) return [];
  return role.rolePermissions.map((rp) => rp.permission.key);
}

export function hasPermission(permissionList, required) {
  if (!required) return true;
  const list = Array.isArray(required) ? required : [required];
  return list.every((key) => permissionList.includes(key));
}

/** Role permissions ∩ gym feature unlocks (FitPlus-style) */
export function resolveGymPermissions(role, featureToggles) {
  const rolePerms = permissionsFromRole(role);
  const allowed = new Set(permissionsFromFeatureToggles(featureToggles || []));
  return rolePerms.filter((key) => allowed.has(key));
}
