import { Router } from 'express';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { sendSignInLink } from '../mail.js';
import { consumeMagicLink, createMagicLink } from '../magic-link.js';
import { findContactByEmail } from '../ninja/contacts.js';
import { loginRateLimit, requireSession } from '../security.js';

export const authRoutes = (redis) => {
  const router = Router();

  // Always answers the same way: a stranger cannot use this to discover clients.
  router.post('/sign-in', loginRateLimit, async (req, res) => {
    const email = String(req.body?.email || '').trim();
    const accepted = { status: 'sent' };

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'invalid_email' });
    }

    try {
      const contact = await findContactByEmail(email);
      if (contact) {
        const url = await createMagicLink(redis, contact);
        await sendSignInLink({ to: contact.email, firstName: contact.firstName, url });
      } else {
        logger.info('Sign-in requested for an address with no matching contact');
      }
    } catch (error) {
      logger.error({ err: error }, 'Sign-in request failed');
    }

    return res.json(accepted);
  });

  router.get('/callback', async (req, res) => {
    const contact = await consumeMagicLink(redis, req.query.token);

    if (!contact) {
      return res.redirect(`${config.portalOrigin}/sign-in?error=link_expired`);
    }

    // New session id on login so a pre-set cookie cannot be fixated.
    return req.session.regenerate((error) => {
      if (error) {
        logger.error({ err: error }, 'Session regeneration failed');
        return res.redirect(`${config.portalOrigin}/sign-in?error=session_failed`);
      }

      req.session.contact = contact;
      return req.session.save(() => res.redirect(`${config.portalOrigin}/`));
    });
  });

  router.get('/me', requireSession, (req, res) => {
    const { clientName, firstName, email } = req.session.contact;
    res.json({ clientName, firstName, email });
  });

  router.post('/sign-out', (req, res) => {
    req.session.destroy(() => {
      res.clearCookie(config.session.name, { path: '/' });
      res.json({ status: 'signed_out' });
    });
  });

  return router;
};
