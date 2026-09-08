const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export const formatMoney = (value) => currency.format(Number(value || 0));

export const formatDate = (value) => (value ? dateFormat.format(new Date(`${value}T00:00:00`)) : '—');

/** Plain-language due text; clearer than a raw date for a client scanning a list. */
export const describeDueDate = (invoice) => {
  if (invoice.status === 'paid') return 'Paid in full';
  if (!invoice.dueDate) return 'No due date';

  const due = new Date(`${invoice.dueDate}T00:00:00`);
  const today = new Date(new Date().toDateString());
  const days = Math.round((due - today) / 86_400_000);

  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due ${formatDate(invoice.dueDate)}`;
};
