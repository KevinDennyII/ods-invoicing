import crypto from 'node:crypto';
import { config } from './config.js';

const KEY_PREFIX = 'magic:';

// Only the hash is stored, so a Redis dump cannot be replayed as a login link.
const hash = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const createMagicLink = async (redis, contact) => {
  const token = crypto.randomBytes(32).toString('base64url');

  await redis.set(
    `${KEY_PREFIX}${hash(token)}`,
    JSON.stringify(contact),
    'EX',
    config.magicLinkTtlSeconds,
  );

  return `${config.portalOrigin}/api/auth/callback?token=${token}`;
};

/** Single use: the token is deleted as it is read, so a forwarded link dies after one click. */
export const consumeMagicLink = async (redis, token) => {
  if (!token) return null;

  const key = `${KEY_PREFIX}${hash(token)}`;
  const payload = await redis.get(key);
  if (!payload) return null;

  await redis.del(key);
  return JSON.parse(payload);
};
