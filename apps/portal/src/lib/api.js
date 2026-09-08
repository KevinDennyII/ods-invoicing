const CSRF_COOKIE = 'ods_csrf';

const readCookie = (name) =>
  document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1];

export class ApiError extends Error {
  constructor(code, status) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

const request = async (path, { method = 'GET', body } = {}) => {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      // Session lives in an httpOnly cookie; nothing sensitive is kept in JS.
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(method === 'GET' ? {} : { 'X-CSRF-Token': readCookie(CSRF_COOKIE) || '' }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('network_error', 0);
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(payload.error || 'request_failed', response.status);
  }

  return payload;
};

export const api = {
  me: () => request('/auth/me'),
  signIn: (email) => request('/auth/sign-in', { method: 'POST', body: { email } }),
  signOut: () => request('/auth/sign-out', { method: 'POST' }),
  invoices: () => request('/invoices'),
  invoice: (id) => request(`/invoices/${id}`),
  payments: () => request('/invoices/payments'),
  autopay: () => request('/autopay'),
  setAutopay: (enabled) => request('/autopay', { method: 'POST', body: { enabled } }),
};
