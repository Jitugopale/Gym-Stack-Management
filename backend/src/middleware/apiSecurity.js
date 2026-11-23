import config from '../config/env.js';

export function requireApiCredentials(req, res, next) {
  if (!config.apiKey && !config.clientSecret) {
    return next();
  }

  const apiKey = req.headers['x-api-key'];
  const clientId = req.headers['x-client-id'];
  const clientSecret = req.headers['x-client-secret'];

  const keyOk = !config.apiKey || apiKey === config.apiKey;
  const idOk = !config.clientId || clientId === config.clientId;
  const secretOk = !config.clientSecret || clientSecret === config.clientSecret;

  if (!keyOk || !idOk || !secretOk) {
    return res.status(401).json({ message: 'Invalid API credentials' });
  }

  return next();
}
