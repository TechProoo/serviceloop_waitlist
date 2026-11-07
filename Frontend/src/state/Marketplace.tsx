import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, collection, errorMessage, setAccessToken, ApiError } from '../api/client';
import type { Equipment } from '../data';
import {MarketplaceContext} from './marketplaceContext';
import type {Account,Booking,RentalRequest,RequestInput,RequestPatch} from './marketplaceContext';

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Account | null>(null), [sessionLoading, setSessionLoading] = useState(true);
  const [catalog, setCatalog] = useState<Equipment[]>([]), [savedEquipment, setSavedEquipment] = useState<Equipment[]>([]);
  const [requests, setRequests] = useState<RentalRequest[]>([]), [ownEquipment, setOwnEquipment] = useState<Equipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true), [catalogError, setCatalogError] = useState('');
  const [workspaceLoading, setWorkspaceLoading] = useState(false), [workspaceError, setWorkspaceError] = useState('');
  const [notification, notify] = useState('');
  const identity = useRef<string | null>(null), authVersion = useRef(0), saving = useRef(new Set<number>());
  const workspaceVersion = useRef(0);
  const navigate = useNavigate(); const location = useLocation();
  const setAccount = useCallback((next: Account | null) => {
    identity.current = next?.id ?? null; setUser(next);
    setSavedEquipment([]); setRequests([]); setBookings([]); setOwnEquipment([]); setWorkspaceError(''); setWorkspaceLoading(!!next);
  }, []);
  useEffect(() => {
    const controller = new AbortController(), version = authVersion.current;
    void api<Account>('/auth/me', { signal: controller.signal }).then(account => {
      if (!controller.signal.aborted && authVersion.current === version) setAccount(account);
    }).catch(() => { /* Public browsing remains available without a session. */ }).finally(() => {
      if (!controller.signal.aborted) setSessionLoading(false);
    });
    const lost = () => { authVersion.current++; setAccessToken(null); setAccount(null); notify('Your session has expired. Please sign in again.'); };
    window.addEventListener('serviceloop:auth-lost', lost);
    return () => { controller.abort(); window.removeEventListener('serviceloop:auth-lost', lost); };
  }, [setAccount]);
  const reloadCatalog = useCallback(() => collection<Equipment>('/equipment')
    .then(items => { setCatalog(items); setCatalogError(''); })
    .catch(error => setCatalogError(errorMessage(error)))
    .finally(() => setCatalogLoading(false)), []);
  useEffect(() => { void reloadCatalog(); }, [reloadCatalog]);
  const reloadWorkspace = useCallback(() => {
    const id = user?.id; if (!id) return Promise.resolve();
    const version = ++workspaceVersion.current;
    const current = () => identity.current === id && workspaceVersion.current === version;
    return Promise.all([collection<Equipment>('/me/saved'), collection<RentalRequest>('/requests'), collection<Equipment>('/me/equipment'), collection<Booking>('/bookings').then(records => records.map(booking => ({ ...booking, receivedAt: performance.now() })))])
      .then(([saved, projects, equipment, records]) => {
        if (!current()) return;
        setSavedEquipment(saved); setRequests(projects); setOwnEquipment(equipment); setBookings(records); setWorkspaceError('');
      })
      .catch(error => { if (current()) setWorkspaceError(errorMessage(error)); })
      .finally(() => { if (current()) setWorkspaceLoading(false); });
  }, [user?.id]);
  useEffect(() => { void reloadWorkspace(); }, [reloadWorkspace]);
  useEffect(() => { if (!notification) return; const timer = setTimeout(() => notify(''), 5000); return () => clearTimeout(timer); }, [notification]);
  async function authenticate(path: string, body: unknown) {
    const result = await api<{ user: Account; accessToken: string }>(path, { method: 'POST', body: JSON.stringify(body) });
    authVersion.current++; setAccessToken(result.accessToken); setAccount(result.user);
  }
  async function signOut() {
    try { await api('/auth/logout', { method: 'POST' }); }
    catch (error) { if (!(error instanceof ApiError && error.status === 401)) throw error; }
    authVersion.current++; setAccessToken(null);
    // Match BrowserRouter's transition so the protected page cannot redirect
    // to sign-in between clearing the account and arriving at the home page.
    startTransition(() => { navigate('/', { replace: true }); setAccount(null); });
  }
  function requireAccount() {
    if (!user) { navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`); throw new Error('Please sign in to continue.'); }
    return user.id;
  }
  function toggleSave(id: number) {
    if (saving.current.has(id)) return;
    let accountId: string; try { accountId = requireAccount(); } catch { return; }
    const exists = savedEquipment.some(item => item.id === id); saving.current.add(id);
    void api(`/me/saved/${id}`, { method: exists ? 'DELETE' : 'PUT' }).then(async () => {
      const items = await collection<Equipment>('/me/saved'); if (identity.current === accountId) setSavedEquipment(items);
    }).catch(error => notify(errorMessage(error))).finally(() => saving.current.delete(id));
  }
  async function addRequest(input: RequestInput) {
    const id = requireAccount(), result = await api<RentalRequest>('/requests', { method: 'POST', body: JSON.stringify(input) });
    if (identity.current === id) setRequests(previous => [result, ...previous]); return result.id;
  }
  async function updateRequest(id: string, patch: RequestPatch) {
    const accountId = requireAccount(), result = await api<RentalRequest>(`/requests/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    if (identity.current === accountId) setRequests(previous => previous.map(item => item.id === id ? result : item));
    if (identity.current === accountId && result.booking) void reloadWorkspace();
    return result;
  }
  async function addEquipment(input: Omit<Equipment, 'id' | 'status'>) {
    const id = requireAccount(), result = await api<Equipment>('/equipment', { method: 'POST', body: JSON.stringify(input) });
    if (identity.current === id) setOwnEquipment(previous => [result, ...previous]); return result.id;
  }
  async function removeEquipment(id: number) {
    const accountId = requireAccount(); await api(`/equipment/${id}`, { method: 'DELETE' });
    if (identity.current === accountId) {
      setOwnEquipment(previous => previous.map(item => item.id === id ? { ...item, status: 'ARCHIVED', available: false } : item));
      setCatalog(previous => previous.filter(item => item.id !== id)); setSavedEquipment(previous => previous.filter(item => item.id !== id));
    }
    notify('Listing archived. Existing request history has been kept.');
  }
  return <MarketplaceContext.Provider value={{ catalog, saved: savedEquipment.map(item => item.id), savedEquipment, requests, bookings, ownEquipment, user, sessionLoading, catalogLoading, catalogError, workspaceLoading, workspaceError,
    signIn: (email, password) => authenticate('/auth/login', { email, password }), register: values => authenticate('/auth/register', values), signOut,
    toggleSave, addRequest, updateRequest, removeRequest: async id => { await updateRequest(id, { status: 'CANCELLED' }); }, addEquipment, removeEquipment, notify, reloadCatalog, reloadWorkspace }}>{children}{notification && <div className="toast" role="status">{notification}</div>}</MarketplaceContext.Provider>;
}
