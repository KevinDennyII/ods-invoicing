import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { Logo } from '../components/Logo.jsx';
import { api } from '../lib/api.js';
import './sign-in.css';

const ERROR_COPY = {
  link_expired: 'That sign-in link has expired or was already used. Request a new one below.',
  session_failed: 'We could not start your session. Please try again.',
};

export const SignIn = () => {
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

  const linkError = ERROR_COPY[params.get('error')];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('sending');

    try {
      await api.signIn(email);
      setStatus('sent');
    } catch (error) {
      setStatus(error.code === 'too_many_requests' ? 'throttled' : 'error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="page sign-in">
      <div className="card stack sign-in__card">
        <Logo size="lg" />
        <h1 className="page__title">Check your email</h1>
          <p>
            If <strong>{email}</strong> is on file, a sign-in link is on its way. It works once and
            expires in 15 minutes.
          </p>
          <Button variant="secondary" onClick={() => setStatus('idle')}>
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page sign-in">
      <div className="card stack sign-in__card">
        <Logo size="lg" />
        <div>
          <h1 className="page__title">View and pay your invoices</h1>
          <p className="page__lede">
            Enter the email address where you receive invoices and we will send you a sign-in link.
            No password to remember.
          </p>
        </div>

        {linkError ? (
          <p className="notice notice--error" role="alert">
            {linkError}
          </p>
        ) : null}

        {status === 'throttled' ? (
          <p className="notice notice--error" role="alert">
            Too many attempts. Please wait 15 minutes and try again.
          </p>
        ) : null}

        {status === 'error' ? (
          <p className="notice notice--error" role="alert">
            Something went wrong on our end. Please try again.
          </p>
        ) : null}

        <form className="stack" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">Email address</span>
            <input
              className="input"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
            />
          </label>

          <Button type="submit" block disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending link…' : 'Email me a sign-in link'}
          </Button>
        </form>
      </div>
    </div>
  );
};
