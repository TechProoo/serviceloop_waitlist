import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icons';
import { api, errorMessage } from '../api/client';
import { useMarketplace } from '../state/marketplaceContext';
import type { Booking } from '../state/marketplaceContext';
import { bookingTiming, useBookingClock } from '../hooks/useBookingClock';

const expiryFormat = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos', hour12: true });

// Keep the API receipt time across unmounts, so opening a cached workspace does
// not restart its countdown. Device timezone/wall-clock changes do not affect it.
function useHoldClock(booking: Booking) {
  const [received] = useState(() => booking.receivedAt ?? performance.now());
  const tick = useBookingClock();
  return bookingTiming({ ...booking, receivedAt: received }, tick);
}

export function ReservationBadge({ booking }: { booking: Booking }) {
  const { state } = useHoldClock(booking);
  const text = state === 'HELD' ? 'Dates reserved' : state === 'EXPIRED' ? 'Reservation expired' : state === 'CANCELLED' ? 'Cancelled' : 'Awaiting confirmation';
  return <span className={`booking-status reservation-badge-${state.toLowerCase()}`}><Icon name={state === 'HELD' ? 'check' : 'clock'} />{text}</span>;
}

export default function BookingReservation({ booking, onChange }: { booking: Booking; onChange: (booking: Booking) => void }) {
  const { user, reloadWorkspace } = useMarketplace();
  const { state, remaining, now } = useHoldClock(booking);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [confirmCancel, setConfirmCancel] = useState(false);
  const totalSeconds = Math.ceil(remaining / 1000), hours = Math.floor(totalSeconds / 3600), minutes = Math.floor((totalSeconds % 3600) / 60), seconds = totalSeconds % 60;
  const canReserve = booking.renterId === user?.id || user?.role === 'ADMIN';
  const nigeriaToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
  const datesPassed = booking.start < nigeriaToday;
  async function change(action: 'reserve' | 'cancel') {
    setBusy(true); setError('');
    try {
      const updated = await api<Booking>(`/bookings/${booking.id}/${action}`, { method: 'POST' });
      onChange(updated); void reloadWorkspace();
    } catch (error) { setError(errorMessage(error)); } finally { setBusy(false); }
  }
  const title = state === 'HELD' ? 'Your dates are held for you.' : state === 'CANCELLED' ? 'This booking has been cancelled.'
    : state === 'EXPIRED' ? 'Your date reservation has expired.' : state === 'NOT_APPLICABLE' ? 'Your service quote is saved.' : 'Ready to reserve your dates?';
  const description = state === 'HELD' ? 'These rental dates are unavailable to other renters during your 2-hour hold. No payment has been collected.'
    : state === 'CANCELLED' ? 'The dates have been released. Your agreed quote details are kept below for reference.'
    : state === 'EXPIRED' ? 'These dates are available for others to reserve. You can check availability and start a new hold.'
    : state === 'NOT_APPLICABLE' ? 'No specific equipment is attached to this booking. Your provider will coordinate availability.'
    : 'Reserve the agreed rental dates for 2 hours. We will check availability before placing the hold.';
  return <section className={`reservation-panel reservation-panel-${state.toLowerCase()}`} aria-labelledby="reservation-title">
    <div className="reservation-summary"><span className="reservation-symbol"><Icon name={state === 'HELD' ? 'shield' : 'calendar'} /></span><div><span className="booking-overline">{state === 'HELD' ? '2-HOUR DATE RESERVATION' : 'YOUR DATE RESERVATION'}</span><h2 id="reservation-title">{title}</h2><p>{description}</p></div>
      {state === 'HELD' && <div className="reservation-countdown"><span>HOLD EXPIRES IN</span><strong aria-label={`${hours} hours ${minutes} minutes remaining`}>{String(hours).padStart(2,'0')}<i>:</i>{String(minutes).padStart(2,'0')}<i>:</i>{String(seconds).padStart(2,'0')}</strong><time dateTime={booking.reservationExpiresAt!}>{expiryFormat.format(new Date(booking.reservationExpiresAt!))} WAT</time></div>}
    </div>
    {state !== 'CANCELLED' && <div className="reservation-footer"><p><Icon name="help" />{state === 'NOT_APPLICABLE' ? 'Payment and rental confirmation are still to come.' : 'A temporary hold is not a confirmed rental. Unpaid holds expire automatically.'}</p><div className="reservation-controls">
      {(state === 'NONE' || state === 'EXPIRED') && canReserve && !datesPassed && <button className="button button-green" disabled={busy} onClick={() => void change('reserve')}>{busy ? 'Checking availability…' : state === 'EXPIRED' ? 'Reserve dates again' : 'Reserve dates'}<Icon name="arrow" /></button>}
      {datesPassed && (state === 'NONE' || state === 'EXPIRED') && <Link className="button button-outline" to={`/request-quote?equipment=${booking.equipmentId}`}>Request new dates</Link>}
      {!confirmCancel && <button className="text-link reservation-cancel-button" disabled={busy} onClick={() => setConfirmCancel(true)}>Cancel booking</button>}
    </div></div>}
    {confirmCancel && <div className="reservation-cancel-confirm"><div><strong>Cancel this booking and release its dates?</strong><p>Your quote details will remain available. To rent again, you’ll need a new quote request.</p></div><button className="button button-outline" disabled={busy} onClick={() => setConfirmCancel(false)}>Keep booking</button><button className="button button-danger" disabled={busy} onClick={() => void change('cancel')}>{busy ? 'Cancelling…' : 'Confirm cancellation'}</button></div>}
    {error && <p role="alert" className="form-error">{error}</p>}
  </section>;
}
