import { config } from '../config.js';

export class NinjaError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'NinjaError';
    this.status = status;
  }
}

const authHeaders = () => ({
  'X-API-TOKEN': config.ninja.apiToken,
  'X-Requested-With': 'XMLHttpRequest',
  Accept: 'application/json',
});

/**
 * Calls the Invoice Ninja admin API. The token stays in this process: every
 * browser-facing route must go through here rather than proxying raw requests.
 */
export const ninjaRequest = async (path, { method = 'GET', body } = {}) => {
  if (!config.ninja.apiToken || config.ninja.apiToken === 'pending') {
    throw new NinjaError('Invoice Ninja API token not configured', 503);
  }

  const response = await fetch(`${config.ninja.baseUrl}/api/v1${path}`, {
    method,
    headers: {
      ...authHeaders(),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new NinjaError(`Invoice Ninja ${method} ${path} failed`, response.status);
  }

  const payload = await response.json();
  return payload.data ?? payload;
};

/** Streams binary responses (PDFs) without buffering them into JSON. */
export const ninjaFetchRaw = async (path) => {
  if (!config.ninja.apiToken || config.ninja.apiToken === 'pending') {
    throw new NinjaError('Invoice Ninja API token not configured', 503);
  }

  const response = await fetch(`${config.ninja.baseUrl}/api/v1${path}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new NinjaError(`Invoice Ninja GET ${path} failed`, response.status);
  }

  return response;
};
