function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'GS';
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

export function Avatar({ name, className = '' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center bg-[var(--primary)] font-bold text-[var(--primary-foreground)] ${className}`}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
