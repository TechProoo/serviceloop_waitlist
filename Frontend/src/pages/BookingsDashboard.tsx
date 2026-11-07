import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icons';
import { Breadcrumbs } from '../components/PageElements';
import WorkspaceNav from '../components/WorkspaceNav';
import { BookingArtwork } from './BookingPage';
import { useMarketplace } from '../state/marketplaceContext';
import type { Booking } from '../state/marketplaceContext';
import { bookingDate, bookingTiming, holdDuration, reservationLabels, useBookingClock } from '../hooks/useBookingClock';
import { money, today } from '../data';
import './bookings-dashboard.css';
import '../components/booking-operations.css';

const filters = [
  { id: 'all', label: 'All bookings' }, { id: 'held', label: 'Dates reserved' },
  { id: 'attention', label: 'Needs attention' }, { id: 'cancelled', label: 'Cancelled' },
] as const;
type Filter = typeof filters[number]['id'];
type Row = { booking: Booking } & ReturnType<typeof bookingTiming>;
const needsAttention = (row: Row) => ['NONE', 'EXPIRED', 'NOT_APPLICABLE'].includes(row.state);
const matchesFilter = (row: Row, filter: Filter) => filter === 'all' || (filter === 'held' ? row.state === 'HELD' : filter === 'attention' ? needsAttention(row) : row.state === 'CANCELLED');
const nigeriaDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' });
const monthFormat = new Intl.DateTimeFormat('en-NG', { month: 'short', timeZone: 'Africa/Lagos' });

function Status({ state }: { state: Booking['reservationState'] }) {
  return <span className={`dashboard-status dashboard-status-${state.toLowerCase()}`}><span />{reservationLabels[state]}</span>;
}

function DashboardBooking({ row, day }: { row: Row; day: string }) {
  const { user } = useMarketplace();
  const { booking, state, remaining } = row;
  const providing = booking.ownerId === user?.id;
  const canReserve = booking.renterId === user?.id || user?.role === 'ADMIN';
  const action = (state === 'EXPIRED' || state === 'NONE') && canReserve ? (booking.start < day ? 'Review rental dates' : 'Review & reserve') : 'View booking';
  return <article className="dashboard-booking" aria-label={`${booking.title}, ${booking.reference}`}>
    <div className="dashboard-booking-body"><BookingArtwork booking={booking} /><div className="dashboard-booking-content">
      <div className="dashboard-booking-meta"><span className="booking-reference">{booking.reference}</span><Status state={state} /></div>
      <h3><Link to={`/bookings/${booking.id}`}>{booking.title}</Link></h3>
      <p className="dashboard-counterparty"><Icon name="user" />{providing ? `Rented by ${booking.renterName}` : `Provided by ${booking.vendor}`}</p>
      <div className="dashboard-booking-facts"><span><Icon name="calendar" />{bookingDate(booking.start)} – {bookingDate(booking.end)}<small>{booking.days} {booking.days === 1 ? 'day' : 'days'}</small></span><span><Icon name="pin" />{booking.location}</span></div>
    </div></div>
    <div className="dashboard-booking-footer"><div className="dashboard-agreed"><span>AGREED QUOTE</span><strong>{money(booking.agreedAmount)}</strong></div>
      <div className={`dashboard-hold-note ${state === 'HELD' ? 'is-held' : ''}`}>
        <Icon name={state === 'CANCELLED' ? 'close' : 'clock'} />
        <span>{state === 'HELD' ? <>Hold ends in <strong>{holdDuration(remaining)}</strong></> : state === 'CANCELLED' ? 'Booking cancelled' : state === 'EXPIRED' ? 'Hold expired · dates released' : state === 'NONE' ? 'Dates still need a reservation' : 'Coordinate with your provider'}</span>
      </div>
      <Link className="dashboard-booking-action" to={`/bookings/${booking.id}`}>{action}<Icon name="arrow" /></Link>
    </div>
    {booking.equipmentId !== null && booking.status !== 'CANCELLED' && <div className="dashboard-inspections"><span><Icon name="lock" />Inspection previews</span><Link to={`/bookings/${booking.id}/handover`} aria-label={`Handover checklist for ${booking.title}`}>Handover</Link><Link to={`/bookings/${booking.id}/return`} aria-label={`Return checklist for ${booking.title}`}>Return</Link></div>}
  </article>;
}

export default function BookingsDashboard() {
  const { user, bookings, workspaceLoading, workspaceError, reloadWorkspace } = useMarketplace();
  const [params, setParams] = useSearchParams();
  const [refreshing, setRefreshing] = useState(false);
  const tick = useBookingClock();
  const filter = filters.find(item => item.id === params.get('status'))?.id ?? 'all';
  const search = params.get('q') || '';
  const sort = params.get('sort') === 'start' ? 'start' : 'recent';
  const role = params.get('role') === 'renting' ? 'renting' : params.get('role') === 'providing' ? 'providing' : 'all';
  const canProvide = user?.role === 'OWNER' || user?.role === 'ADMIN';
  const pageSize = 8;

  useEffect(() => {
    void reloadWorkspace();
    const refresh = () => { void reloadWorkspace(); };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [reloadWorkspace]);

  function updateParam(key: string, value: string, replace = false) {
    // BrowserRouter writes history before its React transition commits. Read
    // that latest URL so a quick sort/filter click cannot restore an old search.
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace });
  }
  function clearFilters() {
    const next = new URLSearchParams(window.location.search);
    ['q', 'status', 'page'].forEach(key => next.delete(key));
    setParams(next);
  }
  async function refresh() { setRefreshing(true); try { await reloadWorkspace(); } finally { setRefreshing(false); } }

  const rows: Row[] = bookings.map(booking => ({ booking, ...bookingTiming(booking, tick) }));
  const day = rows[0] ? nigeriaDay.format(new Date(rows[0].now)) : today();
  const scoped = rows.filter(({ booking }) => !canProvide || role === 'all' || (role === 'renting' ? booking.renterId === user?.id : booking.ownerId === user?.id));
  const held = scoped.filter(row => row.state === 'HELD').sort((a, b) => a.remaining - b.remaining);
  const attention = scoped.filter(needsAttention);
  const open = scoped.filter(row => row.state !== 'CANCELLED');
  const upcoming = open.filter(row => row.booking.start >= day).sort((a, b) => a.booking.start.localeCompare(b.booking.start) || a.booking.id.localeCompare(b.booking.id)).slice(0, 3);
  const term = search.trim().toLocaleLowerCase();
  const filtered = scoped.filter(row => matchesFilter(row, filter) && (!term || [row.booking.reference, row.booking.title, row.booking.location, row.booking.vendor, row.booking.renterName].join(' ').toLocaleLowerCase().includes(term)))
    .sort((a, b) => (sort === 'start' ? a.booking.start.localeCompare(b.booking.start) : b.booking.acceptedAt.localeCompare(a.booking.acceptedAt)) || a.booking.reference.localeCompare(b.booking.reference));
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const requestedPage = Number(params.get('page'));
  const page = Math.min(pageCount, Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1);
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const ready = !workspaceLoading && !workspaceError;
  const firstName = user?.name.trim().split(/\s+/)[0] || 'there';

  return <main id="main" tabIndex={-1} className="bookings-dashboard">
    <div className="container">
      <Breadcrumbs items={[{ label: 'My workspace', to: '/requests' }, { label: 'Bookings' }]} />
      <header className="dashboard-heading"><div><span className="eyebrow"><span className="orange-dash" />YOUR PROJECTS, IN MOTION</span><h1>Booking dashboard<span>.</span></h1><p>Good to see you, {firstName}. Keep every rental in the loop.</p></div><Link className="button button-green" to="/request-quote"><Icon name="plus" />New quote request</Link></header>
      <div className="dashboard-workspace-bar"><WorkspaceNav active="bookings" /><button className="dashboard-refresh" disabled={refreshing || workspaceLoading} onClick={() => void refresh()}><Icon name="refresh" />{refreshing ? 'Refreshing…' : 'Refresh bookings'}</button></div>

      {workspaceLoading ? <section className="dashboard-loading" role="status"><span>Getting your bookings together…</span><div className="dashboard-skeleton-stats" aria-hidden="true">{[1, 2, 3, 4].map(item => <span key={item} />)}</div><div className="dashboard-skeleton-list" aria-hidden="true" /></section>
        : workspaceError ? <section className="dashboard-empty dashboard-error" role="alert"><span className="dashboard-empty-icon"><Icon name="help" /></span><h2>We couldn’t load your bookings.</h2><p>{workspaceError}</p><button className="button button-green" disabled={refreshing} onClick={() => void refresh()}>{refreshing ? 'Trying again…' : 'Try again'}</button></section>
          : <>
            {canProvide && <div className="dashboard-perspective"><span>VIEWING</span><div aria-label="Booking perspective">{[{ id: 'all', label: 'All my bookings' }, { id: 'renting', label: 'I’m renting' }, { id: 'providing', label: 'I’m providing' }].map(item => <button key={item.id} aria-pressed={role === item.id} onClick={() => updateParam('role', item.id === 'all' ? '' : item.id)}>{item.label}</button>)}</div></div>}
            <section className="dashboard-metrics" aria-label="Booking overview">
              <div className="dashboard-metric"><div><span>Total bookings</span><Icon name="file" /></div><strong>{scoped.length.toLocaleString()}</strong><p>Your accepted quotes</p></div>
              <div className="dashboard-metric dashboard-metric-held"><div><span>Live date holds</span><Icon name="shield" /></div><strong>{held.length.toLocaleString()}<span className="dashboard-live-dot" /></strong><p>Reserved for up to 2 hours</p></div>
              <div className="dashboard-metric"><div><span>Needs attention</span><Icon name="clock" /></div><strong>{attention.length.toLocaleString()}</strong><p>Review dates or coordinate a service</p></div>
              <div className="dashboard-metric"><div><span>Agreed quote total</span><Icon name="tag" /></div><strong className="dashboard-value">{money(open.reduce((sum, row) => sum + row.booking.agreedAmount, 0))}</strong><p>Excludes cancelled · not payments</p></div>
            </section>

            <div className="dashboard-body"><div className="dashboard-main">
              {held[0] && <section className="dashboard-priority" aria-label="Next hold to expire"><span className="dashboard-priority-icon"><Icon name="clock" /></span><div><span className="dashboard-kicker">KEEP YOUR PROJECT MOVING</span><h2>{held.length === 1 ? 'Your dates are on hold.' : `${held.length} date holds are live.`}</h2><p>{held[0].booking.title} · next hold ends in <strong>{holdDuration(held[0].remaining)}</strong></p></div><Link to={`/bookings/${held[0].booking.id}`} aria-label={`Review hold for ${held[0].booking.title}`}><Icon name="arrow" /></Link></section>}

              <section className="dashboard-records" aria-labelledby="booking-list-heading">
                <div className="dashboard-section-heading"><div><h2 id="booking-list-heading">Your bookings <span>{scoped.length}</span></h2><p>The details agreed. The next steps ahead.</p></div></div>
                <div className="dashboard-filters" aria-label="Filter bookings by status">{filters.map(item => <button key={item.id} aria-pressed={filter === item.id} onClick={() => updateParam('status', item.id === 'all' ? '' : item.id)}>{item.label}<span>{scoped.filter(row => matchesFilter(row, item.id)).length}</span></button>)}</div>
                <div className="dashboard-search-sort"><label className="dashboard-search"><Icon name="search" /><span className="sr-only">Search bookings</span><input type="search" value={search} onChange={event => updateParam('q', event.target.value, true)} placeholder="Search equipment, reference or location" maxLength={200} /></label><label className="dashboard-sort"><span>Sort by</span><select aria-label="Sort bookings" value={sort} onChange={event => updateParam('sort', event.target.value === 'recent' ? '' : event.target.value)}><option value="recent">Recently accepted</option><option value="start">Rental start date</option></select></label></div>
                {filtered.length ? <><div className="dashboard-results" role="status">{filtered.length} {filtered.length === 1 ? 'booking' : 'bookings'}{term && ` matching “${search.trim()}”`}</div><div className="dashboard-booking-list">{visible.map(row => <DashboardBooking key={row.booking.id} row={row} day={day} />)}</div></>
                  : <div className="dashboard-empty"><span className="dashboard-empty-icon"><Icon name={term || filter !== 'all' ? 'search' : 'calendar'} /></span><h2>{term || filter !== 'all' ? 'No bookings match this view.' : scoped.length === 0 && bookings.length > 0 ? 'No bookings in this view yet.' : 'Your next chapter starts with a quote.'}</h2><p>{term || filter !== 'all' ? 'Try another search or clear your filters to see your bookings.' : 'Once a quote is accepted, its rental details and date reservation will appear here.'}</p>{term || filter !== 'all' ? <button className="button button-outline" onClick={clearFilters}>Clear filters</button> : <Link className="button button-green" to="/requests">View quote requests<Icon name="arrow" /></Link>}</div>}
                {pageCount > 1 && <nav className="dashboard-pagination" aria-label="Booking pages"><span>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span><div><button disabled={page === 1} onClick={() => updateParam('page', String(page - 1))}>Previous</button><span>Page {page} of {pageCount}</span><button disabled={page === pageCount} onClick={() => updateParam('page', String(page + 1))}>Next<Icon name="arrow" /></button></div></nav>}
              </section>
            </div>

            <aside className="dashboard-sidebar" aria-label="Rental planning"><section className="dashboard-upcoming"><div className="dashboard-side-heading"><span className="dashboard-side-icon"><Icon name="calendar" /></span><span className="dashboard-kicker">A LOOK AHEAD</span></div><h2>Coming up<span>.</span></h2><p>Planned start dates.<br />Rental confirmation is still pending.</p>
              {upcoming.length ? <ol>{upcoming.map(({ booking, state }) => <li key={booking.id}><span className="dashboard-date-tile"><small>{monthFormat.format(new Date(`${booking.start}T00:00:00Z`))}</small><strong>{Number(booking.start.slice(-2))}</strong></span><div><Link to={`/bookings/${booking.id}`}>{booking.title}<Icon name="diagonal" /></Link><span>{booking.start === day ? 'Today' : bookingDate(booking.start)} · {booking.days} {booking.days === 1 ? 'day' : 'days'}</span><small>{reservationLabels[state]}</small></div></li>)}</ol> : <div className="dashboard-upcoming-empty"><Icon name="calendar" /><p>Your next project starts here. Future rental dates will appear in this space.</p></div>}
              <span className="dashboard-timezone"><span />Dates shown in Nigeria time (WAT)</span>
            </section>
            <section className="dashboard-guide"><span className="dashboard-kicker">KNOW YOUR NEXT STEP</span><h2>A little planning.<br />A smoother rental.</h2><ol><li><span>01</span><div><h3>Keep an eye on your hold</h3><p>Unpaid reservations expire after 2 hours. Review a booking to reserve available dates again.</p></div></li><li><span>02</span><div><h3>Settle the details</h3><p>Agree on delivery, collection and any operating requirements with your provider.</p></div></li><li><span>03</span><div><h3>Stay in the loop</h3><p>A date hold is temporary. Payment and final rental confirmation are still to come.</p></div></li></ol><Link to="/how-it-works" className="text-link">How Service Loop works<Icon name="arrow" /></Link></section>
            </aside></div>
          </>}
      {ready && <p className="dashboard-footnote"><Icon name="shield" />Your agreed details stay saved, even when a hold expires or a booking is cancelled.</p>}
    </div>
  </main>;
}
