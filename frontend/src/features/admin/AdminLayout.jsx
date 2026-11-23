import { Outlet } from 'react-router-dom';
import Shell from '@/components/layout/Shell';
import { getAdminNav } from '@/config/adminNav';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout() {
  const { hasPermission } = useAuth();

  return (
    <Shell
      title="Platform admin"
      brandHref={ROUTES.DASHBOARD}
      navItems={getAdminNav(hasPermission)}
    >
      <Outlet />
    </Shell>
  );
}
