import { config } from '../config.js';
import { ninjaRequest } from './client.js';

// Invoice Ninja auto-bill modes on a recurring invoice.
const AUTO_BILL_ON = 'always';
const AUTO_BILL_OFF = 'off';

const ACTIVE_RECURRING_STATUS = 2;

const listRecurringForClient = (clientId) =>
  ninjaRequest(`/recurring_invoices?client_id=${clientId}&per_page=100`);

/**
 * Autopay state is derived from the client's recurring invoices plus whether
 * they have a stored payment method (gateway token) on file.
 */
export const getAutopayStatus = async (clientId) => {
  const [recurring, tokens] = await Promise.all([
    listRecurringForClient(clientId),
    ninjaRequest(`/clients/${clientId}?include=gateway_tokens`).then((c) => c.gateway_tokens || []),
  ]);

  const active = recurring.filter((r) => !r.is_deleted && r.status_id === ACTIVE_RECURRING_STATUS);

  return {
    hasPaymentMethod: tokens.length > 0,
    paymentMethods: tokens.map((token) => ({
      id: token.id,
      label: token.meta?.brand ? `${token.meta.brand} ending ${token.meta.last4}` : 'Saved method',
      isDefault: Boolean(token.is_default),
    })),
    schedules: active.map((r) => ({
      id: r.id,
      number: r.number,
      frequency: r.frequency_id,
      nextSendDate: r.next_send_date,
      amount: Number(r.amount),
      autopay: r.auto_bill === AUTO_BILL_ON,
    })),
    // Adding or removing a card happens on Invoice Ninja's PCI-scoped pages.
    managePaymentMethodsUrl: `${config.ninja.publicUrl}/client/payment_methods`,
  };
};

/** Flips auto-bill for every active schedule the client owns. */
export const setAutopay = async (clientId, enabled) => {
  const recurring = await listRecurringForClient(clientId);
  const active = recurring.filter((r) => !r.is_deleted && r.status_id === ACTIVE_RECURRING_STATUS);

  await Promise.all(
    active.map((r) =>
      ninjaRequest(`/recurring_invoices/${r.id}`, {
        method: 'PUT',
        body: { auto_bill: enabled ? AUTO_BILL_ON : AUTO_BILL_OFF },
      }),
    ),
  );

  return getAutopayStatus(clientId);
};
