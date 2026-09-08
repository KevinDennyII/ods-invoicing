import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LinkButton } from '../components/Button.jsx';
import { StatusPill } from '../components/StatusPill.jsx';
import { api } from '../lib/api.js';
import { describeDueDate, formatDate, formatMoney } from '../lib/format.js';
import './invoice-detail.css';

export const InvoiceDetail = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .invoice(id)
      .then((data) => setInvoice(data.invoice))
      .catch((err) =>
        setError(
          err.status === 404
            ? 'That invoice is not available on your account.'
            : 'We could not load this invoice. Please refresh.',
        ),
      );
  }, [id]);

  if (error) {
    return (
      <div className="page stack">
        <p className="notice notice--error" role="alert">
          {error}
        </p>
        <Link to="/">Back to invoices</Link>
      </div>
    );
  }

  if (!invoice) {
    return <p className="muted">Loading invoice…</p>;
  }

  const isPayable = invoice.status !== 'paid' && Boolean(invoice.paymentUrl);

  return (
    <div className="page stack-lg">
      <div>
        <Link className="detail__back" to="/">
          ← All invoices
        </Link>
        <div className="detail__heading">
          <h1 className="page__title">Invoice {invoice.number}</h1>
          <StatusPill status={invoice.status} />
        </div>
        <p className="page__lede">{describeDueDate(invoice)}</p>
      </div>

      <div className="card stack">
        <dl className="detail__facts">
          <div>
            <dt>Issued</dt>
            <dd>{formatDate(invoice.date)}</dd>
          </div>
          <div>
            <dt>Due</dt>
            <dd>{formatDate(invoice.dueDate)}</dd>
          </div>
          <div>
            <dt>Invoice total</dt>
            <dd>{formatMoney(invoice.amount)}</dd>
          </div>
          <div>
            <dt>Balance due</dt>
            <dd className="detail__balance">{formatMoney(invoice.balance)}</dd>
          </div>
        </dl>

        {invoice.lineItems.length > 0 ? (
          <table className="detail__items">
            <caption className="visually-hidden">Invoice line items</caption>
            <thead>
              <tr>
                <th scope="col">Description</th>
                <th scope="col">Qty</th>
                <th scope="col">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item, index) => (
                <tr key={`${item.description}-${index}`}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{formatMoney(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {invoice.publicNotes ? <p className="muted">{invoice.publicNotes}</p> : null}
      </div>

      <div className="detail__actions">
        {isPayable ? (
          <LinkButton href={invoice.paymentUrl}>Pay {formatMoney(invoice.balance)}</LinkButton>
        ) : null}
        <LinkButton variant="secondary" href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer">
          Download PDF
        </LinkButton>
      </div>
    </div>
  );
};
