import * as authService from '../../../services/shared/authService.js';
import { AUTH_REALM } from '../../../constants/roles.js';
import {
  attachAuthSession,
  clearAuthCookies,
} from '../../../utils/cookies.js';

function handle(res, next, fn) {
  Promise.resolve(fn())
    .then((data) => res.json(data))
    .catch(next);
}

export function adminLogin(req, res, next) {
  const { email, password } = req.body;
  Promise.resolve(authService.adminLogin(email, password))
    .then((data) => {
      if (data.requires2fa) return res.json(data);
      return res.json(attachAuthSession(res, data, AUTH_REALM.ADMIN));
    })
    .catch(next);
}

export function adminVerify2fa(req, res, next) {
  const { email, challengeId, otp } = req.body;
  Promise.resolve(
    authService.adminVerify2fa({ email, challengeId, otp })
  )
    .then((data) => res.json(attachAuthSession(res, data, AUTH_REALM.ADMIN)))
    .catch(next);
}

export function gymLogin(req, res, next) {
  const { email, password } = req.body;
  const slug = req.params.slug || req.body.slug;
  Promise.resolve(authService.gymLogin(email, password, slug))
    .then((data) => {
      if (data.requires2fa) return res.json(data);
      return res.json(attachAuthSession(res, data, AUTH_REALM.GYM));
    })
    .catch(next);
}

export function gymVerify2fa(req, res, next) {
  const { email, challengeId, otp } = req.body;
  const slug = req.params.slug || req.body.slug;
  Promise.resolve(
    authService.gymVerify2fa({ email, slug, challengeId, otp })
  )
    .then((data) => res.json(attachAuthSession(res, data, AUTH_REALM.GYM)))
    .catch(next);
}

export function adminMe(req, res, next) {
  handle(res, next, () => authService.adminMe(req.auth.userId));
}

export function gymMe(req, res, next) {
  handle(res, next, () => authService.gymMe(req.auth.userId, req.auth.gymId));
}

export function adminLogout(req, res) {
  clearAuthCookies(res, AUTH_REALM.ADMIN);
  res.json({ ok: true, realm: AUTH_REALM.ADMIN });
}

export function gymLogout(req, res) {
  clearAuthCookies(res, AUTH_REALM.GYM);
  res.json({ ok: true, realm: AUTH_REALM.GYM });
}
