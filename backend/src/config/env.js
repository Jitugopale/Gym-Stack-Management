import 'dotenv/config';

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

const allowedOrigins = String(process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

 const config = {
  port: Number(process.env.PORT || 4000),
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'gym-stack',
  appDisplayName: 'Gym Stack Management',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  allowedOrigins,
  jwt: {
    adminSecret: required('ADMIN_JWT_SECRET', 'dev-admin-secret'),
    gymSecret: required('JWT_SECRET', 'dev-gym-secret'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '15d',
  },
  apiKey: process.env.API_KEY || '',
  clientId: process.env.CLIENT_ID || '',
  clientSecret: process.env.CLIENT_SECRET || '',
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
    max: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
  },
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
  cookieSecure: String(process.env.COOKIE_SECURE || 'false') === 'true',
  authCookies: {
    // Separate cookies so admin + gym sessions coexist (FitPlus-style)
    adminAccessTokenName:
      process.env.COOKIE_ADMIN_ACCESS_TOKEN_NAME || 'gs_admin_access',
    adminRefreshTokenName:
      process.env.COOKIE_ADMIN_REFRESH_TOKEN_NAME || 'gs_admin_refresh',
    gymAccessTokenName:
      process.env.COOKIE_GYM_ACCESS_TOKEN_NAME || 'gs_gym_access',
    gymRefreshTokenName:
      process.env.COOKIE_GYM_REFRESH_TOKEN_NAME || 'gs_gym_refresh',
    legacyNames: ['adminToken', 'gymToken', 'gs_access', 'gs_refresh'],
    path: process.env.COOKIE_PATH || '/',
    domain: process.env.COOKIE_DOMAIN || undefined,
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    secure:
      String(process.env.COOKIE_SECURE || 'false') === 'true' ||
      (process.env.NODE_ENV === 'production' &&
        String(process.env.COOKIE_SECURE || '') !== 'false'),
  },
  mail: {
    brevoApiKey: process.env.BREVO_API_KEY || '',
    brevoEmail: process.env.BREVO_EMAIL || '',
  },
  otp: {
    expiresMinutes: Number(process.env.OTP_EXPIRES_MINUTES || 10),
    exposeInResponse: String(process.env.OTP_EXPOSE_IN_RESPONSE || 'false') === 'true',
  },
  databaseUrl: process.env.DATABASE_URL,
};

export default config;
