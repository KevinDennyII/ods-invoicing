import { config } from '../config.js';
import { ninjaRequest } from './client.js';

// Invoice Ninja status ids. Named here so route code reads in business terms.
const STATUS = {
  1: 'draft',
  2: 'sent',
  3: 'partial',
  4: 'paid',
  5: 'cancelled',
};

const isOverdue = (invoice) => {
  if (!invoice.due_date || Number(invoice.balance) <= 0) return false;
  return new Date(invoice.due_date) < new Date(new Date().toDateString());
};

/**
 * Builds the client-portal payment URL from the contact's invitation.
 * Payment always happens on Invoice Ninja's gateway pages, so no card data
 * ever passes through this service.
 */
const paymentUrl = (invoice, contactId) => {
  const invitation = (invoice.invitations || []).find((i) => i.client_contact_id === contactId)
    || (invoice.invitations || [])[0];
  if (!invitation?.key) return null;
  return `${config.ninja.publicUrl}/client/invoice/${invitation.key}`;
};

const toPortalInvoice = (invoice, contactId) => ({
  id: invoice.id,
  number: invoice.number,
  date: invoice.date,
  dueDate: invoice.due_date,
  amount: Number(invoice.amount),
  balance: Number(invoice.balance),
  status: isOverdue(invoice) ? 'overdue' : STATUS[invoice.status_id] || 'sent',
  poNumber: invoice.po_number || null,
  paymentUrl: paymentUrl(invoice, contactId),
});

/** Every query is scoped to the session's client id — never a caller-supplied one. */
export const listInvoicesForClient = async ({ clientId, contactId }) => {
  const invoices = await ninjaRequest(
    `/invoices?client_id=${clientId}&include=invitations&per_page=100&sort=date|desc`,
  );

  return invoices
    .filter((invoice) => invoice.status_id !== 1 && !invoice.is_deleted)
    .map((invoice) => toPortalInvoice(invoice, contactId));
};

export const getInvoiceForClient = async ({ invoiceId, clientId, contactId }) => {
  const invoice = await ninjaRequest(`/invoices/${invoiceId}?include=invitations`);

  // Defence in depth: the id came from the URL, so re-check ownership.
  if (invoice.client_id !== clientId || invoice.is_deleted) {
    return null;
  }

  return {
    ...toPortalInvoice(invoice, contactId),
    publicNotes: invoice.public_notes || '',
    lineItems: (invoice.line_items || []).map((item) => ({
      description: item.notes || item.product_key,
      quantity: Number(item.quantity),
      cost: Number(item.cost),
      lineTotal: Number(item.quantity) * Number(item.cost),
    })),
  };
};

export const listPaymentsForClient = async (clientId) => {
  const payments = await ninjaRequest(`/payments?client_id=${clientId}&per_page=50&sort=date|desc`);

  return payments
    .filter((payment) => !payment.is_deleted)
    .map((payment) => ({
      id: payment.id,
      number: payment.number,
      date: payment.date,
      amount: Number(payment.amount),
      transactionReference: payment.transaction_reference || null,
    }));
};
