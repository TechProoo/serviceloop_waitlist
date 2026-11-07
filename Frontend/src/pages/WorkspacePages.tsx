import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { EquipmentCard } from '../components/EquipmentCard';
import { Breadcrumbs, PageHeading, EmptyState } from '../components/PageElements';
import { WorkspaceState } from '../components/ApiState';
import { money } from '../data';
import { useMarketplace } from '../state/marketplaceContext';
import type { RentalRequest } from '../state/marketplaceContext';
import { errorMessage } from '../api/client';
import WorkspaceNav from '../components/WorkspaceNav';

export function SavedPage() {
  const { savedEquipment, toggleSave, workspaceLoading, workspaceError } = useMarketplace();
  return <main id="main" tabIndex={-1} className="inner-page saved-page container"><Breadcrumbs items={[{label:'Saved equipment'}]} /><PageHeading eyebrow="KEEP THE GOOD FINDS CLOSE" title={<>Your equipment.<br /><em>Your shortlist.</em></>} /><WorkspaceState />{!workspaceLoading && !workspaceError && (savedEquipment.length ? <div className="equipment-grid saved-page-grid">{savedEquipment.map(item => <EquipmentCard key={item.id} item={item} saved toggleSave={() => toggleSave(item.id)} />)}</div> : <EmptyState icon="heart" title="Your next project starts with a shortlist." description="Save equipment from the marketplace to find it here on any device." />)}</main>;
}
function RequestCard({ project, incoming }: { project: RentalRequest; incoming: boolean }) {
  const { updateRequest, removeRequest } = useMarketplace();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function change(status: RentalRequest['status']) {
    setBusy(true); setError('');
    try {
      if (status === 'CANCELLED') await removeRequest(project.id);
      else {
        const updated = await updateRequest(project.id, { status, ...(status === 'ACCEPTED' ? { expectedUpdatedAt: project.updatedAt } : {}) });
        if (status === 'ACCEPTED' && updated.booking) navigate(`/bookings/${updated.booking.id}`);
      }
    }
    catch (error) { setError(errorMessage(error)); } finally { setBusy(false); }
  }
  async function quote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); setBusy(true); setError('');
    try { await updateRequest(project.id, { status: 'QUOTED', quotedAmount: Number(data.get('amount')), quoteNotes: String(data.get('notes')).trim() }); }
    catch (error) { setError(errorMessage(error)); } finally { setBusy(false); }
  }
  return <article className="project-request">
    <div className="project-request-top"><div><span className="request-id">{project.id}</span><h2>{project.title}</h2><p>{project.location}</p></div><span className="draft-badge">{project.status.toLowerCase()}</span></div>
    <div className="project-request-details"><span><small>START DATE</small><strong>{project.start}</strong></span><span><small>DURATION</small><strong>{project.days} days</strong></span><span><small>EQUIPMENT ESTIMATE</small><strong>{project.estimate === null ? 'To be quoted' : money(project.estimate)}</strong></span></div>
    <div className="expanded-request"><p>{project.notes || 'No additional notes.'}</p><p><strong>Contact:</strong> {project.name} · {project.email}</p>
      {project.quotedAmount !== null && <div><h3>Complete quote: {money(project.quotedAmount)}</h3><p>{project.quoteNotes}</p></div>}
      {project.booking && <div className="request-live-actions"><Link className="button button-green" to={`/bookings/${project.booking.id}`}>View booking details</Link><span className="booking-reference">{project.booking.reference}</span></div>}
      {incoming && ['SUBMITTED','QUOTED'].includes(project.status) && <form className="form-stack" onSubmit={quote}><h3>{project.status === 'QUOTED' ? 'Revise your quote' : 'Send a quote'}</h3><label>Complete amount (₦)<input name="amount" type="number" min="1" max="10000000000" step="1" defaultValue={project.quotedAmount ?? ''} required /></label><label>What is included?<textarea name="notes" maxLength={2000} defaultValue={project.quoteNotes ?? ''} placeholder="Include delivery, operator, fuel, deposit and return arrangements." /></label><button className="button button-green" disabled={busy}>Send quote</button></form>}
      {!incoming && ['SUBMITTED','QUOTED'].includes(project.status) && <>
        {project.status === 'QUOTED' && <p className="workspace-note">{project.equipmentId ? 'Accepting saves this quote and reserves the rental dates for 2 hours, subject to availability. Payment is not collected yet.' : 'Accepting saves this quote. The ServiceLoop team will coordinate service availability.'}</p>}
        <div className="request-live-actions">{project.status === 'QUOTED' && <><button className="button button-green" disabled={busy} onClick={() => void change('ACCEPTED')}>{busy ? 'Please wait…' : 'Accept quote'}</button><button className="button button-outline" disabled={busy} onClick={() => void change('DECLINED')}>Decline quote</button></>}<button className="button button-outline" disabled={busy} onClick={() => { if (window.confirm('Cancel this request?')) void change('CANCELLED'); }}>Cancel request</button></div>
      </>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  </article>;
}
export function RequestsPage() {
  const { requests, ownEquipment, removeEquipment, workspaceLoading, workspaceError, reloadWorkspace } = useMarketplace();
  const [params] = useSearchParams(); const tab = params.get('tab') === 'listings' ? 'listings' : 'requests';
  const [busy, setBusy] = useState<number | null>(null), [error,setError] = useState('');
  const ownIds = new Set(ownEquipment.map(item => item.id));
  async function archive(id: number) {
    if (!window.confirm('Archive this listing? Existing requests will be kept.')) return;
    setBusy(id); setError(''); try { await removeEquipment(id); } catch (error) { setError(errorMessage(error)); } finally { setBusy(null); }
  }
  if (params.get('tab') === 'bookings') return <Navigate to="/bookings" replace />;
  return <main id="main" tabIndex={-1} className="inner-page requests-page container">
    <Breadcrumbs items={[{label:'My workspace'}]} />
    <div className="workspace-heading"><PageHeading eyebrow="YOUR NEXT CHAPTER, IN ONE PLACE" title={<>Your projects.<br /><em>Your progress.</em></>} description="Review quotes, revisit your booking details and manage your equipment." /><Link className="button button-green" to="/request-quote">New quote request</Link></div>
    <div className="workspace-toolbar"><WorkspaceNav active={tab} /><button className="text-link" disabled={workspaceLoading} onClick={() => void reloadWorkspace()}>Refresh</button></div>
    <WorkspaceState />{error && <p role="alert" className="form-error">{error}</p>}
    {!workspaceLoading && !workspaceError && <>
      {tab === 'requests' && (requests.length ? <div className="project-request-list">{requests.map(project => <RequestCard key={project.id} project={project} incoming={project.equipmentId !== null && ownIds.has(project.equipmentId)} />)}</div> : <EmptyState icon="file" title="Your next project starts here." description="Submit a quote request and track responses in your workspace." to="/request-quote" action="Request a quote" />)}
      {tab === 'listings' && <><div className="my-equipment-list">{ownEquipment.map(item => <article key={item.id}><div><h2>{item.name}</h2><p>{item.location} · {money(item.rate)} / day</p></div><span className="demo-tag">{item.status?.toLowerCase()}</span><Link className="text-link" to={`/equipment/${item.id}`}>View listing</Link>{item.status !== 'ARCHIVED' && <button className="button button-outline" disabled={busy === item.id} onClick={() => void archive(item.id)}>Archive</button>}</article>)}</div><Link className="button button-green" to="/list-equipment">List equipment</Link></>}
    </>}
    <p className="workspace-note">Equipment dates are held for 2 hours after quote acceptance. Unpaid holds expire automatically; cancelling a booking releases its dates immediately. Payments and rental confirmation are still to come.</p>
  </main>;
}
