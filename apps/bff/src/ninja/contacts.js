import { ninjaRequest } from './client.js';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

/**
 * Resolves a login email to the single client contact it belongs to.
 * Returns null when there is no match; callers must not reveal which it was.
 */
export const findContactByEmail = async (email) => {
  const target = normalizeEmail(email);
  if (!target) return null;

  const clients = await ninjaRequest(
    `/clients?email=${encodeURIComponent(target)}&include=contacts&per_page=5`,
  );

  for (const client of clients) {
    const contact = (client.contacts || []).find((c) => normalizeEmail(c.email) === target);
    if (contact) {
      return {
        clientId: client.id,
        clientName: client.display_name || client.name,
        contactId: contact.id,
        contactKey: contact.contact_key,
        firstName: contact.first_name || '',
        email: target,
      };
    }
  }

  return null;
};

export const getClient = (clientId) => ninjaRequest(`/clients/${clientId}`);
