export function AuthCard({ children, eyebrow = 'Platform admin' }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[var(--bg)] px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(circle at 0% 0%, rgba(184,240,0,0.18), transparent 40%), radial-gradient(circle at 100% 100%, rgba(18,22,19,0.08), transparent 35%)',
        }}
        aria-hidden
      />

      <div className="motion-rise relative w-full max-w-md border border-[var(--border)] bg-[var(--surface-elevated)] shadow-[var(--card-shadow)]">
        <div className="h-1.5 w-full bg-[var(--primary)]" aria-hidden />
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <p className="font-display text-xs font-bold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            {eyebrow}
          </p>
          <p className="font-display mt-2 text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
            Gym Stack
          </p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function AuthTitle({ title, subtitle }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold leading-[1.25] tracking-tight text-[var(--foreground)] sm:text-[1.75rem]">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
        {subtitle}
      </p>
    </div>
  );
}

export function AuthButton({
  children,
  disabled,
  loading = false,
  loadingText = 'Please wait…',
  type = 'submit',
  ...props
}) {
  const isDisabled = Boolean(disabled || loading);
  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 bg-[var(--brand-ink)] px-4 py-3 text-sm font-bold leading-normal tracking-wide text-[var(--primary)] outline-none transition hover:bg-[var(--brand-panel)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    >
      {loading ? (
        <span
          className="inline-block size-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent"
          aria-hidden
        />
      ) : null}
      {loading ? loadingText : children}
    </button>
  );
}

export function AuthField({ label, required, ...props }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-semibold text-[var(--foreground)]">
        {label}
        {required ? (
          <span className="text-[var(--destructive)]" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </span>
      <input
        required={required}
        aria-required={required || undefined}
        className="h-12 w-full border border-[var(--input)] bg-white px-3.5 outline-none transition focus:border-[var(--brand-ink)] focus:ring-2 focus:ring-[var(--primary)]/40"
        {...props}
      />
    </label>
  );
}
