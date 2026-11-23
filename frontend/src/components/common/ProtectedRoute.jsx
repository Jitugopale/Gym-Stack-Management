import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/config/routes';

export default function ProtectedRoute({ children, realm }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center text-[var(--muted-foreground)]">
        Loading…
      </div>
    );
  }

  if (!user || user.realm !== realm) {
    return (
      <Navigate
        to={realm === 'admin' ? ROUTES.ADMIN_LOGIN : ROUTES.HOME}
        replace
      />
    );
  }

  return children;
}
