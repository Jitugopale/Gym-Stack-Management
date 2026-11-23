import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { ROUTES, gymRoutes } from '@/config/routes';
import { roleLabel } from '@/utils/roleLabels';

/** FitPlus-style: click header avatar → profile page (no dropdown). */
export function ProfileMenu() {
  const { user } = useAuth();

  if (!user) return null;

  const displayName = user.name?.trim() || 'User';
  const roleText = roleLabel(user.role);
  const displayMeta =
    user.realm === 'gym'
      ? [user.gymName, roleText].filter(Boolean).join(' · ') || user.email
      : user.email || roleText;

  const profileHref =
    user.realm === 'admin'
      ? ROUTES.PROFILE
      : gymRoutes.profile(user.gymSlug || 'iron-peak');

  return (
    <Link
      to={profileHref}
      className="flex min-w-0 cursor-pointer items-center gap-2 p-1 no-underline transition hover:bg-[var(--muted)] sm:gap-3 sm:pr-2"
      aria-label="Open profile"
    >
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          {displayName}
        </p>
        {displayMeta ? (
          <p className="max-w-[200px] truncate text-xs text-[var(--muted-foreground)]">
            {displayMeta}
          </p>
        ) : null}
      </div>
      <Avatar
        name={displayName}
        className="size-9 text-xs sm:size-10 sm:text-sm"
      />
    </Link>
  );
}
