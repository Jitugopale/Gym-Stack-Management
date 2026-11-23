import jwt from 'jsonwebtoken';
import config from '../config/env.js';

export function signAdminToken(payload) {
  return jwt.sign(payload, config.jwt.adminSecret, {
    expiresIn: config.jwt.expiresIn,
  });
}

export function signGymToken(payload) {
  return jwt.sign(payload, config.jwt.gymSecret, {
    expiresIn: config.jwt.expiresIn,
  });
}

export function verifyAdminToken(token) {
  return jwt.verify(token, config.jwt.adminSecret);
}

export function verifyGymToken(token) {
  return jwt.verify(token, config.jwt.gymSecret);
}
