import { Outlet, useParams } from 'react-router-dom';
import Shell from '@/components/layout/Shell';
import { useAuth } from '@/context/AuthContext';
import { getGymNav } from '@/config/gymNav';
import { gymRoutes } from '@/config/routes';

export default function GymLayout() {
  const { slug } = useParams();
  const { user, hasPermission } = useAuth();

  return (
    <Shell
      title={user?.gymName || slug}
      brandHref={gymRoutes.dashboard(slug)}
      navItems={getGymNav(slug, hasPermission)}
    >
      <Outlet />
    </Shell>
  );
}
