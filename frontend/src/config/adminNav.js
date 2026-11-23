import { ROUTES } from './routes';

/** Always use absolute `/admin/...` paths — relative `to="plans"` resolves
 *  against the active child (e.g. `/admin/dashboard/plans`) and 404s home. */
export function getAdminNav(hasPermission = () => true) {
  return [
    { to: ROUTES.DASHBOARD, label: 'Dashboard', end: true },
    hasPermission('gyms.view') && { to: ROUTES.GYMS, label: 'Gyms' },
    hasPermission('users.view') && { to: ROUTES.USERS, label: 'Users' },
    hasPermission('billing.view') && { to: ROUTES.PLANS, label: 'Plans' },
    hasPermission('billing.view') && { to: ROUTES.BILLING, label: 'Billing' },
    hasPermission('access.manage') && { to: ROUTES.MODULES, label: 'Modules' },
    hasPermission('access.manage') && { to: ROUTES.ACTIONS, label: 'Actions' },
    hasPermission('access.manage') && { to: ROUTES.PERMISSIONS, label: 'Permissions' },
    hasPermission('access.manage') && { to: ROUTES.ROLES, label: 'Roles' },
  ].filter(Boolean);
}
