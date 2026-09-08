import RedisStore from 'connect-redis';
import cookieParser from 'cookie-parser';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import Redis from 'ioredis';
import pinoHttp from 'pino-http';

import { config } from './config.js';
import { logger } from './logger.js';
import { NinjaError } from './ninja/client.js';
import { autopayRoutes } from './routes/autopay.js';
import { authRoutes } from './routes/auth.js';
import { invoiceRoutes } from './routes/invoices.js';
import { apiRateLimit, csrfProtection } from './security.js';

const redis = new Redis(config.redisUrl);
const app = express();

// Sits behind cloudflared + nginx; needed for correct client IPs and secure cookies.
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(pinoHttp({ logger }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '64kb' }));
app.use(cookieParser());

app.use(
  session({
    store: new RedisStore({ client: redis, prefix: 'ods_sess:' }),
    name: config.session.name,
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: config.session.ttlSeconds * 1000,
      path: '/',
    },
  }),
);

app.use(csrfProtection);
app.use('/api', apiRateLimit);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes(redis));
app.use('/api/invoices', invoiceRoutes());
app.use('/api/autopay', autopayRoutes());

app.use((req, res) => res.status(404).json({ error: 'not_found' }));

// Upstream details stay in the logs; clients get a generic failure.
app.use((error, req, res, _next) => {
  const status = error instanceof NinjaError && error.status === 404 ? 404 : error instanceof NinjaError && error.status === 503 ? 503 : 500;
  req.log.error({ err: error }, 'Request failed');
  res.status(status).json({
    error: status === 404 ? 'not_found' : status === 503 ? 'service_unavailable' : 'internal_error',
  });
});

const server = app.listen(config.port, () => {
  logger.info({ port: config.port }, 'ODS portal BFF listening');
});

const shutdown = () => {
  server.close(() => redis.quit().finally(() => process.exit(0)));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
