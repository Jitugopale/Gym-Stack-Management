const ROLE_LABELS = {
  super_admin: 'Super Admin',
  super_admin_staff: 'Platform Staff',
  gym_owner: 'Gym Owner',
  gym_staff: 'Gym Staff',
};

export function roleLabel(role) {
  return ROLE_LABELS[role] || String(role || 'User').replaceAll('_', ' ');
}
