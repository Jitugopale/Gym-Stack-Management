/**
 * Gym desk context (FitPlus-style): ensure x-gym-id matches JWT gym.
 */
export function resolveGymContext(req, res, next) {
  const headerGymId = req.headers['x-gym-id'];
  if (headerGymId && req.auth?.gymId && headerGymId !== req.auth.gymId) {
    return res.status(403).json({ message: 'Gym context mismatch' });
  }
  req.gymId = req.auth.gymId;
  next();
}
