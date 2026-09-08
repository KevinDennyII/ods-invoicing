import { Router } from 'express';
import { getAutopayStatus, setAutopay } from '../ninja/autopay.js';
import { requireSession } from '../security.js';

export const autopayRoutes = () => {
  const router = Router();
  router.use(requireSession);

  router.get('/', async (req, res, next) => {
    try {
      res.json(await getAutopayStatus(req.session.contact.clientId));
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const { enabled } = req.body || {};

      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'enabled_must_be_boolean' });
      }

      return res.json(await setAutopay(req.session.contact.clientId, enabled));
    } catch (error) {
      return next(error);
    }
  });

  return router;
};
