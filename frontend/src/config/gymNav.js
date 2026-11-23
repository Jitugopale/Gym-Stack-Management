import { gymRoutes } from './routes';

export function getGymNav(slug, hasPermission) {
  return [
    hasPermission('dashboard.view') && {
      to: gymRoutes.dashboard(slug),
      label: 'Dashboard',
      end: true,
    },
    hasPermission('members.view') && {
      to: gymRoutes.members(slug),
      label: 'Members',
    },
    // Plans desk = manage catalog; plans.view alone is for member enroll dropdowns
    (hasPermission('plans.create') || hasPermission('plans.update')) && {
      to: gymRoutes.membershipPlans(slug),
      label: 'Plans',
    },
    hasPermission('payments.view') && {
      to: gymRoutes.payments(slug),
      label: 'Payments',
    },
    hasPermission('staff.view') && {
      to: gymRoutes.staff(slug),
      label: 'Staff',
    },
    hasPermission('gym_billing.view') && {
      to: gymRoutes.billing(slug),
      label: 'Billing',
    },
  ].filter(Boolean);
}
