import config from '../config/env.js';
import { AUTH_REALM } from '../constants/roles.js';

function baseOptions() {
  return {
    httpOnly: true,
    secure: config.authCookies.secure,
    sameSite: config.authCookies.sameSite,
    path: config.authCookies.path,
    ...(config.authCookies.domain ? { domain: config.authCookies.domain } : {}),
  };
}

function cookieNamesForRealm(realm) {
  if (realm === AUTH_REALM.ADMIN) {
    return {
      access: config.authCookies.adminAccessTokenName,
      refresh: config.authCookies.adminRefreshTokenName,
    };
  }
  return {
    access: config.authCookies.gymAccessTokenName,
    refresh: config.authCookies.gymRefreshTokenName,
  };
}

function expiresToMs(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1000, value * 1000);
  }
  const raw = String(value || '7d').trim();
  const match = raw.match(/^(\d+)([smhd])$/i);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const mult =
    unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  return Math.max(1000, amount * mult);
}

function clearLegacy(res) {
  const options = baseOptions();
  for (const name of config.authCookies.legacyNames || []) {
    res.clearCookie(name, options);
  }
}

/**
 * FitPlus-style: separate admin vs gym HttpOnly cookies so both
 * sessions can coexist in one browser.
 */
export function setAuthCookies(res, { accessToken, expiresIn }, realm) {
  const options = baseOptions();
  const names = cookieNamesForRealm(realm);
  clearLegacy(res);
  if (!accessToken) return;
  res.cookie(names.access, accessToken, {
    ...options,
    maxAge: expiresToMs(expiresIn || config.jwt.expiresIn),
  });
}

export function clearAuthCookies(res, realm) {
  const options = baseOptions();
  const names = cookieNamesForRealm(realm);
  res.clearCookie(names.access, options);
  res.clearCookie(names.refresh, options);
  clearLegacy(res);
}

export function getAccessTokenFromRequest(req, realm) {
  const header = req.headers?.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice(7).trim() || null;
  }
  const names = cookieNamesForRealm(realm);
  return req.cookies?.[names.access] || null;
}

/** Set cookies and strip raw token from JSON (FitPlus). */
export function attachAuthSession(res, result, realm) {
  if (!result?.token) return result;
  setAuthCookies(
    res,
    { accessToken: result.token, expiresIn: config.jwt.expiresIn },
    realm
  );
  const { token: _token, ...safe } = result;
  return {
    ...safe,
    authenticated: true,
    realm,
  };
}
