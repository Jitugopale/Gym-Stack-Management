function brandInitials(name) {
  if (!name) return 'GY';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function GymAuthCard({ branding, children }) {
  const name = branding?.name || 'Your Gym';

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[var(--brand-ink)] px-4 py-10">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-35"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1800&q=80)',
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(160deg, rgba(18,22,19,0.92) 20%, rgba(26,46,18,0.85) 100%)',
        }}
        aria-hidden
      />
      <div className="hero-grain absolute inset-0 opacity-40" aria-hidden />

      <div className="motion-rise relative w-full max-w-md border border-white/10 bg-[var(--surface-elevated)] shadow-[var(--card-shadow)]">
        <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--brand-ink)] px-6 py-4 text-white">
          <span className="flex size-10 items-center justify-center bg-[var(--primary)] font-display text-sm font-extrabold text-[var(--primary-foreground)]">
            {brandInitials(name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold tracking-tight">
              {name}
            </p>
            <p className="text-xs text-white/60">Gym Stack desk</p>
          </div>
        </div>
        <div className="px-6 py-8 sm:px-8">{children}</div>
      </div>
    </div>
  );
}
