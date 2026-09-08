import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';

const CSRF_COOKIE = 'ods_csrf';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Double-submit CSRF: the token is readable by our own JS (so it can echo it in
 * a header) but a cross-site attacker can neither read the cookie nor set the header.
 */
export const csrfProtection = (req, res, next) => {
  let token = req.cookies?.[CSRF_COOKIE];

  if (!token) {
    token = crypto.randomBytes(32).toString('base64url');
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: config.isProduction,
      sameSite: 'lax',
      path: '/',
    });
  }

  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const provided = req.get(CSRF_HEADER);
  const matches =
    provided &&
    provided.length === token.length &&
    crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(token));

  if (!matches) {
    return res.status(403).json({ error: 'invalid_csrf_token' });
  }

  return next();
};

/** Sign-in is the one unauthenticated write, so it gets the tightest budget. */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

export const requireSession = (req, res, next) => {
  if (!req.session?.contact?.clientId) {
    return res.status(401).json({ error: 'not_authenticated' });
  }
  return next();
};
