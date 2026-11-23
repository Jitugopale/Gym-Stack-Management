import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { ToastProvider } from '@/components/common/ToastProvider';
import RouteError from '@/components/layout/RouteError';
import AdminLayout from '@/features/admin/AdminLayout';
import LoginPage from '@/features/admin/auth/LoginPage';
import DashboardPage from '@/features/admin/dashboard/DashboardPage';
import GymsPage from '@/features/admin/gyms/GymsPage';
import UsersPage from '@/features/admin/users/UsersPage';
import PlansPage from '@/features/admin/plans/PlansPage';
import BillingPage from '@/features/admin/billing/BillingPage';
import ModulesPage from '@/features/admin/access/ModulesPage';
import ActionsPage from '@/features/admin/access/ActionsPage';
import PermissionsPage from '@/features/admin/access/PermissionsPage';
import RolesPage from '@/features/admin/access/RolesPage';
import GymRoot from '@/components/gym/GymRoot';
import GymDashboardPage from '@/features/gym/dashboard/GymDashboardPage';
import GymMembersPage from '@/features/gym/members/GymMembersPage';
import GymPlansPage from '@/features/gym/plans/GymPlansPage';
import GymPaymentsPage from '@/features/gym/payments/GymPaymentsPage';
import GymStaffPage from '@/features/gym/staff/GymStaffPage';
import GymBillingPage from '@/features/gym/billing/GymBillingPage';
import HomePage from '@/features/shared/HomePage';
import ProfilePage from '@/features/shared/ProfilePage';
import { ROUTES } from '@/config/routes';

function AdminGate() {
  return (
    <ProtectedRoute realm="admin">
      <AdminLayout />
    </ProtectedRoute>
  );
}

function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center gap-3 px-4 text-center">
      <div>
        <p className="font-display text-2xl font-bold">Page not found</p>
        <a href={ROUTES.HOME} className="mt-3 inline-block text-sm underline">
          Back home
        </a>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/admin/login',
    element: <LoginPage />,
  },
  {
    path: '/admin',
    element: <AdminGate />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'gyms', element: <GymsPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'plans', element: <PlansPage /> },
      { path: 'billing', element: <BillingPage /> },
      { path: 'modules', element: <ModulesPage /> },
      { path: 'actions', element: <ActionsPage /> },
      { path: 'permissions', element: <PermissionsPage /> },
      { path: 'roles', element: <RolesPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  {
    path: '/gym/:slug/login',
    element: <Navigate to=".." relative="path" replace />,
  },
  {
    path: '/gym/:slug',
    element: <GymRoot />,
    errorElement: <RouteError />,
    children: [
      { path: 'dashboard', element: <GymDashboardPage /> },
      { path: 'members', element: <GymMembersPage /> },
      { path: 'membership-plans', element: <GymPlansPage /> },
      { path: 'plans', element: <Navigate to="../membership-plans" replace /> },
      { path: 'payments', element: <GymPaymentsPage /> },
      { path: 'staff', element: <GymStaffPage /> },
      { path: 'billing', element: <GymBillingPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
