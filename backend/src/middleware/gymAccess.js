import {
  GYM_LOGIN_BLOCKED_STATUSES,
  GYM_WRITE_BLOCKED_STATUSES,
} from '../constants/gym.js';

/** Block gym desk login when SaaS status is login_blocked */
export function rejectIfGymLoginBlocked(gym) {
  if (GYM_LOGIN_BLOCKED_STATUSES.includes(gym?.status)) {
    const err = new Error(
      'Gym access locked — subscription unpaid. Contact platform support.'
    );
    err.status = 403;
    throw err;
  }
}

/** Soft-lock / login_block: read OK, writes blocked */
export function requireGymWritable(req, res, next) {
  const status = req.auth?.gym?.status;
  if (GYM_WRITE_BLOCKED_STATUSES.includes(status)) {
    return res.status(403).json({
      success: false,
      message: 'Gym is view-only (soft lock) or locked. Pay the cloud invoice to unlock writes.',
      gymStatus: status,
    });
  }
  next();
}
