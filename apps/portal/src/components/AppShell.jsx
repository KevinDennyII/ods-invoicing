import { NavLink } from 'react-router-dom';
import { Logo } from './Logo.jsx';
import { Button } from './Button.jsx';
import './shell.css';

const navLinkClass = ({ isActive }) => (isActive ? 'shell__nav-link is-active' : 'shell__nav-link');

export const AppShell = ({ session, onSignOut, children }) => (
  <div className="shell-frame">
    <header className="shell-frame__header">
      <div className="shell shell-frame__bar">
        <Logo />
        {session ? (
          <nav className="shell__nav" aria-label="Billing">
            <NavLink to="/" end className={navLinkClass}>
              Invoices
            </NavLink>
            <NavLink to="/autopay" className={navLinkClass}>
              Autopay
            </NavLink>
            <Button variant="quiet" onClick={onSignOut}>
              Sign out
            </Button>
          </nav>
        ) : null}
      </div>
    </header>

    <main className="shell shell-frame__main" id="main">
      {children}
    </main>

    <footer className="shell shell-frame__footer">
      <p className="muted">
        Questions about a charge? Email{' '}
        <a href="mailto:kevin@ohhdennyservices.com">kevin@ohhdennyservices.com</a>.
      </p>
    </footer>
  </div>
);
