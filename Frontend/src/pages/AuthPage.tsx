import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMarketplace } from '../state/marketplaceContext';
import { errorMessage } from '../api/client';
export function RequireAccount({ children, owner = false }: { children: ReactNode; owner?: boolean }) {
  const { user, sessionLoading } = useMarketplace(); const location = useLocation();
  if (sessionLoading) return <main id="main" className="container inner-page api-state" role="status">Checking your session…</main>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (owner && user.role === 'CUSTOMER') return <main id="main" className="container inner-page api-state"><h1>An equipment owner account is required.</h1><p>Sign out and use an owner account to list equipment.</p><Link to="/account" className="button button-green">Your account</Link></main>;
  return children;
}
export default function AuthPage() {
  const { user, sessionLoading, signIn, register } = useMarketplace(); const navigate = useNavigate(); const [params] = useSearchParams();
  const [creating, setCreating] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const requested = params.get('next') || '/requests';
  const next = requested.startsWith('/') && !requested.startsWith('//') && !requested.includes('\\') && !/^\/(login|account)(?:[/?#]|$)/.test(requested) ? requested : '/requests';
  if (sessionLoading) return <main id="main" className="inner-page container api-state" role="status">Checking your session…</main>;
  if (user) return <Navigate to={next} replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); setBusy(true); setError('');
    try {
      const email = String(data.get('email')).trim().toLowerCase(), password = String(data.get('password'));
      if (creating) await register({ email, password, name: String(data.get('name')).trim(), role: data.get('role') === 'OWNER' ? 'OWNER' : 'CUSTOMER' });
      else await signIn(email, password);
      navigate(next, { replace: true });
    } catch (error) { setError(errorMessage(error)); } finally { setBusy(false); }
  }
  return <main id="main" className="inner-page container"><section className="auth-card"><span className="eyebrow">YOUR NEXT PROJECT STARTS HERE</span><h1>{creating ? 'Create your account.' : 'Welcome back.'}</h1><p>{creating ? 'Keep your equipment and project requests together.' : 'Sign in to your ServiceLoop workspace.'}</p><form className="form-stack" onSubmit={submit}>{creating && <><label>Your name<input name="name" required maxLength={100} autoComplete="name" /></label><label>I want to<select name="role" defaultValue={next.startsWith('/list-equipment') ? 'OWNER' : 'CUSTOMER'}><option value="CUSTOMER">Rent equipment and request services</option><option value="OWNER">List my equipment and receive requests</option></select></label></>}<label>Email address<input name="email" type="email" required autoComplete="email" maxLength={254} /></label><label>Password<input name="password" type="password" required minLength={12} maxLength={128} autoComplete={creating ? 'new-password' : 'current-password'} /></label>{creating && <small>Use at least 12 characters.</small>}{error && <p role="alert" className="form-error">{error}</p>}<button className="button button-green" disabled={busy}>{busy ? 'Please wait…' : creating ? 'Create account' : 'Sign in'}</button></form><button className="text-link" disabled={busy} onClick={() => { setCreating(!creating); setError(''); }}>{creating ? 'Already have an account? Sign in' : 'New here? Create an account'}</button></section></main>;
}
export function AccountPage() {
  const { user, signOut } = useMarketplace(); const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function logout() { setBusy(true); setError(''); try { await signOut(); } catch (error) { setError(errorMessage(error)); } finally { setBusy(false); } }
  return <main id="main" className="inner-page container"><section className="auth-card"><h1>Your account.</h1><p>{user?.name}</p><p>{user?.email}</p><p>{user?.role === 'OWNER' ? 'Equipment owner' : user?.role === 'ADMIN' ? 'Administrator' : 'Renter'}</p>{error && <p role="alert">{error}</p>}<Link className="button button-outline" to="/bookings">Booking dashboard</Link><button className="button button-green" disabled={busy} onClick={() => void logout()}>{busy ? 'Signing out…' : 'Sign out'}</button></section></main>;
}
