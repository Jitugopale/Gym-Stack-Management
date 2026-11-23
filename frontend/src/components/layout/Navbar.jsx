import { Menu } from 'lucide-react';
import { ProfileMenu } from '@/components/layout/ProfileMenu';

export function Navbar({ onMenuClick, title }) {
  return (
    <header className="relative z-50 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface-elevated)] px-3 sm:h-[4.5rem] sm:gap-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex size-10 items-center justify-center text-[var(--foreground)] hover:bg-[var(--muted)] lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" aria-hidden />
        </button>
        {title ? (
          <p className="hidden truncate text-sm font-semibold text-[var(--muted-foreground)] sm:block lg:hidden">
            {title}
          </p>
        ) : null}
      </div>

      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <ProfileMenu />
      </div>
    </header>
  );
}
