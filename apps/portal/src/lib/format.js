const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export const formatMoney = (value) => currency.format(Number(value || 0));

/** Invoice Ninja sends dates as YYYY-MM-DD or "YYYY-MM-DD HH:MM:SS". */
const parseDate = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  const day = raw.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const date = new Date(`${day}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (value) => {
  const date = parseDate(value);
  return date ? dateFormat.format(date) : '—';
};

/** Plain-language due text; clearer than a raw date for a client scanning a list. */
export const describeDueDate = (invoice) => {
  if (invoice.status === 'paid') return 'Paid in full';
  if (!invoice.dueDate) return 'No due date';

  const due = parseDate(invoice.dueDate);
  if (!due) return 'No due date';

  const today = new Date(new Date().toDateString());
  const days = Math.round((due - today) / 86_400_000);

  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due ${formatDate(invoice.dueDate)}`;
};
