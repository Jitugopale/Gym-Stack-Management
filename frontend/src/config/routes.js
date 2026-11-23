/** Gym Stack URL map */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/admin/login',
  ADMIN_LOGIN: '/admin/login',
  DASHBOARD: '/admin/dashboard',
  GYMS: '/admin/gyms',
  USERS: '/admin/users',
  PLANS: '/admin/plans',
  BILLING: '/admin/billing',
  MODULES: '/admin/modules',
  ACTIONS: '/admin/actions',
  PERMISSIONS: '/admin/permissions',
  ROLES: '/admin/roles',
  PROFILE: '/admin/profile',
};

export const gymRoutes = {
  login: (slug) => `/gym/${slug}`,
  root: (slug) => `/gym/${slug}`,
  dashboard: (slug) => `/gym/${slug}/dashboard`,
  members: (slug) => `/gym/${slug}/members`,
  membershipPlans: (slug) => `/gym/${slug}/membership-plans`,
  payments: (slug) => `/gym/${slug}/payments`,
  staff: (slug) => `/gym/${slug}/staff`,
  billing: (slug) => `/gym/${slug}/billing`,
  profile: (slug) => `/gym/${slug}/profile`,
};
