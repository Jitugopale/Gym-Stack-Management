import adminRoutes from './admin/index.js';
import gymRoutes from './gym/index.js';

/** Public surface (FitPlus-style registry). */
export const publicRoutes = {};

export const protectedRoutes = {
  admin: {
    path: '/api/v1/admin',
    router: adminRoutes,
    description: 'Platform admin routes',
  },
  gym: {
    path: '/api/v1/gym',
    router: gymRoutes,
    description: 'Gym routes',
  },
};
