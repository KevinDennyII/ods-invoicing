import pino from 'pino';

const REDACTED = [
  'req.headers.cookie',
  'req.headers.authorization',
  'req.headers["x-api-token"]',
  'res.headers["set-cookie"]',
];

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: { paths: REDACTED, censor: '[redacted]' },
});
