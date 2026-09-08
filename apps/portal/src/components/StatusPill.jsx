import './ui.css';

const LABELS = {
  paid: 'Paid',
  sent: 'Open',
  partial: 'Partly paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export const StatusPill = ({ status }) => (
  <span className={`status status--${status}`}>{LABELS[status] || 'Open'}</span>
);
