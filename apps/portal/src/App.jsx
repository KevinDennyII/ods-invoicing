import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell.jsx';
import { useSession } from './hooks/useSession.js';
import { Autopay } from './pages/Autopay.jsx';
import { InvoiceDetail } from './pages/InvoiceDetail.jsx';
import { Invoices } from './pages/Invoices.jsx';
import { SignIn } from './pages/SignIn.jsx';

export const App = () => {
  const { session, isLoading, backendDown, signOut } = useSession();

  if (isLoading) {
    return (
      <AppShell session={null}>
        <p className="muted loading-pulse" aria-live="polite">
          Loading…
        </p>
      </AppShell>
    );
  }

  if (backendDown && !session) {
    return (
      <AppShell session={null}>
        <div className="page stack">
          <h1 className="page__title">Billing is temporarily unavailable</h1>
          <p className="page__lede">
            We could not reach the billing service. Please try again in a few minutes. If this
            continues, email{' '}
            <a href="mailto:ohhdennyservicesllc@gmail.com">ohhdennyservicesllc@gmail.com</a>.
          </p>
          <p className="notice notice--info">
            The sign-in page still loads from our CDN; only live invoice data needs the billing
            backend to be online.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell session={session} onSignOut={signOut}>
      {session ? (
        <Routes>
          <Route path="/" element={<Invoices session={session} />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/autopay" element={<Autopay />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="*" element={<Navigate to="/sign-in" replace />} />
        </Routes>
      )}
    </AppShell>
  );
};
