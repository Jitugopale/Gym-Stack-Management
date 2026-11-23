import { Link } from 'react-router-dom';
import { ROUTES, gymRoutes } from '@/config/routes';

const DEFAULT_GYM = 'iron-peak';

export default function HomePage() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[var(--brand-ink)] text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'linear-gradient(120deg, rgba(18,22,19,0.88) 8%, rgba(26,46,18,0.72) 48%, rgba(18,22,19,0.55) 100%), url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=2000&q=80)',
        }}
        aria-hidden
      />
      <div className="hero-grain pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div
        className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[var(--primary)]/20 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-end px-5 pb-14 pt-10 sm:px-8 sm:pb-16 lg:justify-center lg:pb-20">
        <p className="motion-rise font-display text-5xl font-extrabold tracking-tight text-[var(--primary)] sm:text-6xl md:text-7xl lg:text-8xl">
          Gym Stack
        </p>

        <span
          className="motion-sweep mt-5 block h-1.5 w-28 bg-[var(--primary)] sm:w-36"
          aria-hidden
        />

        <h1 className="motion-rise-delay font-display mt-7 max-w-2xl text-3xl font-bold leading-[1.05] tracking-tight text-white sm:text-4xl md:text-5xl">
          Run every gym desk from one stack.
        </h1>

        <p className="motion-rise-delay mt-4 max-w-lg text-base text-white/75 sm:text-lg">
          Multi-tenant gym SaaS — platform control and front-desk access in two
          clicks.
        </p>

        <div className="motion-rise-late mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            to={ROUTES.LOGIN}
            className="inline-flex min-h-12 items-center justify-center bg-[var(--primary)] px-7 py-3 text-sm font-bold leading-normal tracking-wide text-[var(--primary-foreground)] transition hover:brightness-95"
          >
            Admin login
          </Link>
          <Link
            to={gymRoutes.login(DEFAULT_GYM)}
            className="inline-flex min-h-12 items-center justify-center border border-white/35 bg-white/5 px-7 py-3 text-sm font-bold leading-normal tracking-wide text-white transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            Gym login
          </Link>
        </div>
      </div>
    </div>
  );
}
