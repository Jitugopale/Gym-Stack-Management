export const API_ENDPOINTS = {
  ADMIN_AUTH: {
    LOGIN: '/admin/auth/login',
    VERIFY_2FA: '/admin/auth/verify-2fa',
    ME: '/admin/auth/me',
    LOGOUT: '/admin/auth/logout',
  },
  GYM_AUTH: {
    LOGIN: (slug) => `/gym/${slug}/auth/login`,
    VERIFY_2FA: (slug) => `/gym/${slug}/auth/verify-2fa`,
    ME: '/gym/auth/me',
    LOGOUT: '/gym/auth/logout',
  },
  GYM_PUBLIC: {
    BY_SLUG: (slug) => `/gym/public/${slug}`,
  },
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_GYMS: {
    LIST: '/admin/gyms',
    DETAIL: (id) => `/admin/gyms/${id}`,
    FEATURES: (id) => `/admin/gyms/${id}/features`,
  },
};
