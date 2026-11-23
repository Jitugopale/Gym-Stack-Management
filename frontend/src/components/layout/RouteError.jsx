import {
  isRouteErrorResponse,
  useLocation,
  useNavigate,
  useRouteError,
} from 'react-router-dom';

export default function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();
  const location = useLocation();
  const message = isRouteErrorResponse(error)
    ? error.statusText || String(error.data || '')
    : error?.message || 'Something went wrong';

  const fallback = location.pathname.startsWith('/gym/')
    ? `/${location.pathname.split('/').slice(1, 3).join('/')}/dashboard`
    : '/admin/dashboard';

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-md space-y-3 text-center">
        <p className="font-display text-lg font-bold text-[var(--destructive)]">
          This page failed to load
        </p>
        <p className="text-sm text-[var(--muted-foreground)]">{String(message)}</p>
        <button
          type="button"
          className="cursor-pointer bg-[var(--brand-ink)] px-3 py-2 text-sm font-bold text-[var(--primary)]"
          onClick={() => navigate(fallback)}
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}
