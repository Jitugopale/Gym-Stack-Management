import { Navigate, useLocation, useParams } from 'react-router-dom';
import GymLayout from '@/components/layout/GymLayout';
import { gymRoutes } from '@/config/routes';
import { useAuth } from '@/context/AuthContext';
import GymLoginPage from '@/features/gym/auth/GymLoginPage';

function QuietBoot() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-[var(--bg)]"
      aria-busy="true"
    >
      <span
        className="size-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]"
        aria-hidden="true"
      />
      <span className="sr-only">Loading</span>
    </div>
  );
}

/**
 * FitPlus-style:
 * /gym/:slug → branded login when guest
 * /gym/:slug/dashboard|members|… → gym app when authenticated
 */
export default function GymRoot() {
  const { slug } = useParams();
  const { pathname } = useLocation();
  const { user, loading } = useAuth();

  const isGymSession = Boolean(user && user.realm === 'gym');
  const atGymEntry =
    pathname === `/gym/${slug}` ||
    pathname === `/gym/${slug}/` ||
    pathname === `/gym/${slug}/login`;

  if (loading) {
    return <QuietBoot />;
  }

  if (isGymSession) {
    if (atGymEntry) {
      return <Navigate to={gymRoutes.dashboard(slug)} replace />;
    }
    return <GymLayout />;
  }

  if (atGymEntry) {
    return <GymLoginPage />;
  }

  return <Navigate to={gymRoutes.login(slug)} replace />;
}
