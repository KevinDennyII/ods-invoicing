import { useEffect, useState } from 'react';
import { Button, LinkButton } from '../components/Button.jsx';
import { api } from '../lib/api.js';
import { formatDate, formatMoney } from '../lib/format.js';
import './autopay.css';

export const Autopay = () => {
  const [state, setState] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [justEnabled, setJustEnabled] = useState(false);

  useEffect(() => {
    api
      .autopay()
      .then(setState)
      .catch(() => setError('We could not load your autopay settings. Please refresh.'));
  }, []);

  const toggle = async (enabled) => {
    setIsSaving(true);
    setError(null);

    try {
      setState(await api.setAutopay(enabled));
      setJustEnabled(enabled);
    } catch {
      setError('That change did not save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (error && !state) {
    return (
      <p className="notice notice--error" role="alert">
        {error}
      </p>
    );
  }

  if (!state) {
    return <p className="muted">Loading autopay settings…</p>;
  }

  const isOn = state.schedules.length > 0 && state.schedules.every((s) => s.autopay);

  return (
    <div className="page stack-lg">
      <header>
        <h1 className="page__title">Autopay</h1>
        <p className="page__lede">
          Turn this on and your recurring invoices are charged automatically on their due date. You
          still get an emailed invoice and receipt every time.
        </p>
      </header>

      {error ? (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="card stack autopay__panel" aria-labelledby="autopay-state">
        <div className="autopay__state">
          <span
            className={`autopay__dot ${isOn ? 'is-on' : ''} ${justEnabled && isOn ? 'is-celebrating' : ''}`}
            aria-hidden="true"
          />
          <h2 id="autopay-state">{isOn ? 'Autopay is on' : 'Autopay is off'}</h2>
        </div>

        {!state.hasPaymentMethod ? (
          <>
            <p className="notice notice--info">
              Add a card or bank account first. Payment details are entered on our secure payments
              page and are never stored by this portal.
            </p>
            <LinkButton href={state.managePaymentMethodsUrl}>Add a payment method</LinkButton>
          </>
        ) : (
          <>
            <ul className="autopay__methods">
              {state.paymentMethods.map((method) => (
                <li key={method.id}>
                  {method.label}
                  {method.isDefault ? <span className="muted"> · default</span> : null}
                </li>
              ))}
            </ul>

            {state.schedules.length === 0 ? (
              <p className="muted">
                You have no recurring invoices yet, so there is nothing to autopay.
              </p>
            ) : (
              <Button onClick={() => toggle(!isOn)} disabled={isSaving} variant={isOn ? 'secondary' : 'primary'}>
                {isSaving ? 'Saving…' : isOn ? 'Turn autopay off' : 'Turn autopay on'}
              </Button>
            )}

            <LinkButton variant="secondary" href={state.managePaymentMethodsUrl}>
              Manage payment methods
            </LinkButton>
          </>
        )}
      </section>

      {state.schedules.length > 0 ? (
        <section className="stack" aria-labelledby="schedules">
          <h2 id="schedules">Recurring invoices</h2>
          <ul className="autopay__schedules">
            {state.schedules.map((schedule) => (
              <li key={schedule.id} className="card autopay__schedule">
                <div>
                  <strong>{formatMoney(schedule.amount)}</strong>
                  <p className="muted">Next invoice {formatDate(schedule.nextSendDate)}</p>
                </div>
                <span className={`status ${schedule.autopay ? 'status--paid' : 'status--cancelled'}`}>
                  {schedule.autopay ? 'Autopay on' : 'Manual'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
};
