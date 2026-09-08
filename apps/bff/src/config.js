const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const optional = (name, fallback = '') => process.env[name] || fallback;

export const config = {
  port: Number(optional('PORT', '8080')),
  isProduction: process.env.NODE_ENV === 'production',

  // Where clients reach the portal. Used for cookie scope and magic-link URLs.
  portalOrigin: optional('PORTAL_ORIGIN', 'http://localhost:5173').replace(/\/$/, ''),

  ninja: {
    // Internal address (Docker network) for API calls.
    baseUrl: optional('NINJA_BASE_URL', 'http://ninja-nginx').replace(/\/$/, ''),
    // Public address used when handing a client off to Invoice Ninja's payment pages.
    publicUrl: optional('NINJA_PUBLIC_URL', 'https://admin.pay.ohhdennyservices.com').replace(/\/$/, ''),
    // "pending" until the admin creates an API token after first boot.
    apiToken: optional('NINJA_API_TOKEN', 'pending'),
  },

  session: {
    secret: required('SESSION_SECRET'),
    name: 'ods_portal_sid',
    ttlSeconds: 60 * 60 * 8,
  },

  redisUrl: optional('REDIS_URL', 'redis://redis:6379'),

  // Sign-in links are single use and short lived.
  magicLinkTtlSeconds: 15 * 60,

  mail: {
    host: optional('MAIL_HOST'),
    port: Number(optional('MAIL_PORT', '587')),
    user: optional('MAIL_USERNAME'),
    pass: optional('MAIL_PASSWORD'),
    fromAddress: optional('MAIL_FROM_ADDRESS', 'billing@ohhdennyservices.com'),
    fromName: optional('MAIL_FROM_NAME', 'OhhDenny Services'),
  },
};
