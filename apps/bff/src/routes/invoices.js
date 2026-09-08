import { Router } from 'express';
import { ninjaFetchRaw } from '../ninja/client.js';
import {
  getInvoiceForClient,
  listInvoicesForClient,
  listPaymentsForClient,
} from '../ninja/invoices.js';
import { requireSession } from '../security.js';

export const invoiceRoutes = () => {
  const router = Router();
  router.use(requireSession);

  router.get('/', async (req, res, next) => {
    try {
      const { clientId, contactId } = req.session.contact;
      res.json({ invoices: await listInvoicesForClient({ clientId, contactId }) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/payments', async (req, res, next) => {
    try {
      res.json({ payments: await listPaymentsForClient(req.session.contact.clientId) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const { clientId, contactId } = req.session.contact;
      const invoice = await getInvoiceForClient({ invoiceId: req.params.id, clientId, contactId });

      if (!invoice) {
        return res.status(404).json({ error: 'not_found' });
      }
      return res.json({ invoice });
    } catch (error) {
      return next(error);
    }
  });

  router.get('/:id/pdf', async (req, res, next) => {
    try {
      const { clientId, contactId } = req.session.contact;
      const invoice = await getInvoiceForClient({ invoiceId: req.params.id, clientId, contactId });

      if (!invoice) {
        return res.status(404).json({ error: 'not_found' });
      }

      const upstream = await ninjaFetchRaw(`/invoices/${req.params.id}/download`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="invoice-${invoice.number}.pdf"`);

      const buffer = Buffer.from(await upstream.arrayBuffer());
      return res.send(buffer);
    } catch (error) {
      return next(error);
    }
  });

  return router;
};
