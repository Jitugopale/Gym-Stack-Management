import { useNavigate } from 'react-router-dom';
import {
  Building2,
  LogOut,
  Mail,
  Shield,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button, PageHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { ROUTES, gymRoutes } from '@/config/routes';
import { roleLabel } from '@/utils/roleLabels';

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="border border-[var(--border)] bg-[var(--bg)] px-4 py-3.5">
      <div className="flex items-center gap-2 text-[var(--brand-ink)]">
        <Icon className="size-4" strokeWidth={1.9} aria-hidden />
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
          {label}
        </p>
      </div>
      <p className="mt-1.5 break-words text-sm font-semibold text-[var(--foreground)]">
        {value || '—'}
      </p>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const roleText = roleLabel(user.role);
  const isGym = user.realm === 'gym';

  const onLogout = async () => {
    const slug = user.gymSlug || 'iron-peak';
    await logout();
    navigate(isGym ? gymRoutes.login(slug) : ROUTES.LOGIN);
  };

  return (
    <div>
      <PageHeader
        title="Profile"
        action={
          <Button variant="danger" onClick={onLogout}>
            <span className="inline-flex items-center gap-2">
              <LogOut className="size-4" aria-hidden />
              Logout
            </span>
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-4 border border-[var(--border)] bg-[var(--brand-ink)] px-5 py-6 text-white">
        <Avatar
          name={user.name}
          className="size-16 border-2 border-white/30 bg-[var(--primary)] text-xl text-[var(--primary-foreground)]"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
            Your profile
          </p>
          <h1 className="mt-1 truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
            {user.name || 'User'}
          </h1>
          <p className="mt-1 text-sm font-medium text-white/85">{roleText}</p>
        </div>
        <span className="inline-flex items-center bg-white/15 px-3 py-1.5 text-xs font-bold capitalize ring-1 ring-white/25">
          {isGym ? user.gymStatus || 'active' : 'platform'}
        </span>
      </div>

      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
        About
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard icon={UserRound} label="Full name" value={user.name} />
        <InfoCard icon={Mail} label="Email" value={user.email} />
        <InfoCard icon={Shield} label="Role" value={roleText} />
        {isGym ? (
          <InfoCard icon={Building2} label="Gym" value={user.gymName} />
        ) : null}
        <InfoCard
          icon={ShieldCheck}
          label="Email 2FA"
          value={user.requireEmailOtp ? 'On' : 'Off'}
        />
        {isGym ? (
          <InfoCard icon={Building2} label="Gym slug" value={user.gymSlug} />
        ) : null}
      </div>
    </div>
  );
}
