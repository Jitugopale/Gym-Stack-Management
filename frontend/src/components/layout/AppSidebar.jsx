import { NavLink } from 'react-router-dom';
import {
  Building2,
  CreditCard,
  KeyRound,
  LayoutGrid,
  LogOut,
  Shield,
  Layers,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROUTES, gymRoutes } from '@/config/routes';

const ICONS = {
  Dashboard: LayoutGrid,
  Gyms: Building2,
  Users: Users,
  Billing: CreditCard,
  Plans: Layers,
  Modules: LayoutGrid,
  Actions: KeyRound,
  Permissions: Shield,
  Roles: Shield,
  Members: Users,
  Payments: Wallet,
  Staff: Users,
};

export function AppSidebar({
  title,
  brandHref,
  navItems,
  onNavigate,
  onLogout,
  showLogo = true,
  className = '',
}) {
  const { user } = useAuth();

  return (
    <aside
      className={`flex h-full w-full flex-col bg-[var(--surface-elevated)] text-[var(--foreground)] ${className}`}
    >
      {showLogo ? (
        <NavLink
          to={brandHref}
          onClick={onNavigate}
          className="group flex h-16 shrink-0 items-center gap-3 border-b border-[var(--border)] px-5 no-underline sm:h-[4.5rem] sm:px-6"
          aria-label={`Go to ${title}`}
        >
          <span className="flex size-9 items-center justify-center bg-[var(--brand-ink)] font-display text-sm font-extrabold text-[var(--primary)] transition-transform duration-200 group-hover:scale-105">
            GS
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-tight text-[var(--foreground)]">
              Gym Stack
            </span>
            <span className="block truncate text-[11px] font-medium text-[var(--muted-foreground)]">
              {title}
            </span>
          </span>
        </NavLink>
      ) : null}

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 py-3">
        {navItems.map((item) => {
          const Icon = ICONS[item.label] || LayoutGrid;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end === true}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px] font-semibold no-underline transition ${
                  isActive
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                }`
              }
            >
              <Icon className="pointer-events-none size-4 shrink-0" strokeWidth={1.85} aria-hidden />
              <span className="pointer-events-none">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-[var(--border)] px-2 py-3">
        <NavLink
          to={
            user?.realm === 'admin'
              ? ROUTES.PROFILE
              : gymRoutes.profile(user?.gymSlug || 'iron-peak')
          }
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px] font-semibold no-underline transition ${
              isActive
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
            }`
          }
        >
          <UserRound className="size-4 shrink-0" strokeWidth={1.85} aria-hidden />
          <span>Profile</span>
        </NavLink>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            onLogout?.();
          }}
          className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-[var(--brand-ink)] transition hover:bg-[var(--brand-ink)] hover:text-[var(--primary)]"
        >
          <LogOut className="size-4 shrink-0" strokeWidth={1.85} aria-hidden />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
