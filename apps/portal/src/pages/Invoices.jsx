import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LinkButton } from '../components/Button.jsx';
import { PixelAccent } from '../components/PixelAccent.jsx';
import { StatusPill } from '../components/StatusPill.jsx';
import { api } from '../lib/api.js';
import { describeDueDate, formatDate, formatMoney } from '../lib/format.js';
import './invoices.css';

const outstandingTotal = (invoices) =>
  invoices.filter((i) => i.status !== 'paid').reduce((sum, i) => sum + i.balance, 0);

const summarize = (invoices) => {
  const open = invoices.filter((i) => i.status !== 'paid');
  if (open.length === 0) return 'Everything is paid up. Nothing needs your attention right now.';

  const total = formatMoney(outstandingTotal(invoices));
  return open.length === 1
    ? `You have ${total} outstanding on 1 invoice.`
    : `You have ${total} outstanding across ${open.length} invoices.`;
};

export const Invoices = ({ session }) => {
  const [invoices, setInvoices] = useState(null);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.invoices(), api.payments()])
      .then(([invoiceData, paymentData]) => {
        setInvoices(invoiceData.invoices);
        setPayments(paymentData.payments);
      })
      .catch(() => setError('We could not load your invoices. Please refresh.'));
  }, []);

  if (error) {
    return (
      <p className="notice notice--error" role="alert">
        {error}
      </p>
    );
  }

  if (!invoices) {
    return <p className="muted">Loading your invoices…</p>;
  }

  return (
    <div className="page stack-lg">
      <header>
        <h1 className="page__title">
          {session?.firstName ? `Hi ${session.firstName},` : 'Your invoices'}
        </h1>
        <p className="page__lede">{summarize(invoices)}</p>
      </header>

      {invoices.length === 0 ? (
        <div className="empty">
          <PixelAccent />
          <p>No invoices yet. New invoices will appear here automatically.</p>
        </div>
      ) : (
        <ul className="invoice-list">
          {invoices.map((invoice, index) => (
            <li
              key={invoice.id}
              className="invoice-list__item"
              /* Stagger is capped so a long list never feels slow. */
              style={{ '--enter-delay': `${Math.min(index, 8) * 40}ms` }}
            >
              <div className="invoice-card">
                <div className="invoice-card__main">
                  <Link className="invoice-card__number" to={`/invoices/${invoice.id}`}>
                    Invoice {invoice.number}
                  </Link>
                  <p className="muted invoice-card__meta">{describeDueDate(invoice)}</p>
                </div>

                <div className="invoice-card__amount">
                  <StatusPill status={invoice.status} />
                  <strong>
                    {formatMoney(invoice.status === 'paid' ? invoice.amount : invoice.balance)}
                  </strong>
                </div>

                {invoice.status !== 'paid' && invoice.paymentUrl ? (
                  <LinkButton href={invoice.paymentUrl} className="invoice-card__action">
                    Pay now
                  </LinkButton>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {payments.length > 0 ? (
        <section className="stack" aria-labelledby="payment-history">
          <h2 id="payment-history">Payment history</h2>
          <ul className="payment-list">
            {payments.map((payment) => (
              <li key={payment.id} className="payment-list__item">
                <span>{formatDate(payment.date)}</span>
                <span className="muted">{payment.transactionReference || `Payment ${payment.number}`}</span>
                <strong>{formatMoney(payment.amount)}</strong>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
};
