import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import { ROUTES, gymRoutes } from '@/config/routes';
import { storage } from '@/utils/storage';

export default function Shell({ title, brandHref, navItems, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const homeHref =
    brandHref ||
    (user?.realm === 'admin'
      ? ROUTES.DASHBOARD
      : gymRoutes.dashboard(user?.gymSlug || 'iron-peak'));

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const onLogout = async () => {
    const realm = user?.realm;
    const slug = user?.gymSlug || storage.getGymSlug() || 'iron-peak';
    await logout();
    navigate(realm === 'admin' ? ROUTES.LOGIN : gymRoutes.login(slug));
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--bg)]">
      <aside className="relative z-20 hidden w-60 shrink-0 border-r border-[var(--border)] bg-[var(--surface-elevated)] lg:block">
        <AppSidebar
          title={title}
          brandHref={homeHref}
          navItems={navItems}
          onLogout={onLogout}
        />
      </aside>

      {menuOpen ? (
        <div
          className="fixed inset-x-0 bottom-0 top-16 z-40 sm:top-[4.5rem] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute top-0 left-0 h-full w-[min(16rem,85vw)] border-r border-[var(--border)] bg-[var(--surface-elevated)] shadow-xl">
            <AppSidebar
              title={title}
              brandHref={homeHref}
              navItems={navItems}
              showLogo={false}
              onNavigate={() => setMenuOpen(false)}
              onLogout={onLogout}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          title={title}
          onMenuClick={() => setMenuOpen((open) => !open)}
        />
        <main className="min-h-0 flex-1 overflow-y-auto px-3 py-4 pb-8 sm:px-4 lg:px-4">
          {user?.gymStatus && user.gymStatus !== 'active' ? (
            <div className="mb-3 border border-[var(--warn)]/40 bg-[var(--warn)]/10 px-3 py-2 text-sm text-[var(--foreground)]">
              Gym status: <strong>{user.gymStatus}</strong>
              {user.gymStatus === 'soft_lock'
                ? ' — view only until cloud invoice is paid.'
                : user.gymStatus === 'grace'
                  ? ' — pay soon to avoid soft lock.'
                  : null}
            </div>
          ) : null}
          <div className="border border-[var(--border)] bg-[var(--surface-elevated)] p-3 shadow-[var(--card-shadow)] sm:p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
