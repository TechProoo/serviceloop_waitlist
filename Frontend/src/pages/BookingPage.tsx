import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Breadcrumbs } from '../components/PageElements';
import { Icon, MachineIcon } from '../components/Icons';
import { money } from '../data';
import { useMarketplace } from '../state/marketplaceContext';
import type { Booking } from '../state/marketplaceContext';
import BookingReservation, { ReservationBadge } from '../components/BookingReservation';
import { bookingDate } from '../hooks/useBookingClock';
import { useBookingDetails } from '../hooks/useBookingDetails';
import BookingOperations from '../components/BookingOperations';
import './bookings.css';

export function BookingArtwork({ booking }: { booking: Booking }) {
  const [failed, setFailed] = useState(false);
  return <div className="booking-artwork">{booking.image && !failed
    ? <img src={booking.image} alt={booking.title} onError={() => setFailed(true)} />
    : <MachineIcon type={booking.equipmentCategory || ''} />}</div>;
}

export default function BookingPage() {
  const { id } = useParams();
  const { notify } = useMarketplace();
  const { booking, loading, error, missing, retry, updateBooking } = useBookingDetails(id);
  async function copyReference() {
    if (!booking) return;
    try { await navigator.clipboard.writeText(booking.reference); notify('Booking reference copied.'); }
    catch { notify(`Your booking reference is ${booking.reference}`); }
  }

  return <main id="main" tabIndex={-1} className="inner-page container booking-page">
    <Breadcrumbs items={[{ label: 'My workspace', to: '/requests' }, { label: 'Bookings', to: '/bookings' }, { label: booking?.reference || 'Booking details' }]} />
    {loading ? <div className="booking-loading" role="status"><Icon name="file" /><h1>Opening your booking…</h1><p>Getting the details together.</p></div>
      : error ? <div className="booking-loading" role="alert"><Icon name="file" /><h1>{missing ? 'Booking not found.' : 'We couldn’t load this booking.'}</h1><p>{missing ? 'Check the link and make sure you are signed in to the right account.' : error}</p><div className="booking-actions">{!missing && <button className="button button-green" onClick={retry}>Try again</button>}<Link className="button button-outline" to="/bookings">Back to bookings</Link></div></div>
      : booking && <>
        <header className="booking-heading"><div><span className="eyebrow"><span className="orange-dash" />YOUR NEXT PROJECT, TAKING SHAPE</span><h1>Your rental,<br /><em>in detail.</em></h1><p>One place for everything you’ve agreed on.</p></div><div className="booking-reference-box"><Icon name="file" /><span>BOOKING REFERENCE</span><strong>{booking.reference}</strong><button className="text-link" onClick={() => void copyReference()}>Copy reference<Icon name="copy" /></button></div></header>

        <BookingReservation key={`${booking.id}:${booking.serverTime}`} booking={booking} onChange={updateBooking} />
        <BookingOperations booking={booking} />

        <div className="booking-layout"><div className="booking-main">
          <section className="rental-detail-panel booking-equipment" aria-labelledby="booking-equipment-title"><BookingArtwork booking={booking} /><div><span className="booking-overline">{booking.equipmentCategory || booking.service}</span><h2 id="booking-equipment-title">{booking.title}</h2><p>Provided by <strong>{booking.vendor}</strong></p><div className="booking-specs">{booking.capacity && <span><Icon name="tag" />{booking.capacity}</span>}{booking.operator !== null && <span><Icon name="user" />{booking.operator ? 'Operator included in listing' : 'Equipment only in listing'}</span>}</div>{booking.equipmentLocation && <p className="booking-equipment-location"><Icon name="pin" />Based in {booking.equipmentLocation}</p>}</div></section>

          <section className="rental-detail-panel" aria-labelledby="rental-details-title"><div className="booking-section-heading"><span className="booking-section-icon"><Icon name="calendar" /></span><div><span className="booking-overline">THE PLAN</span><h2 id="rental-details-title">Your rental details</h2></div></div><dl className="booking-details-grid"><div><dt>Start date</dt><dd>{bookingDate(booking.start)}</dd></div><div><dt>Last rental day</dt><dd>{bookingDate(booking.end)}</dd></div><div><dt>Duration</dt><dd>{booking.days} {booking.days === 1 ? 'day' : 'days'}</dd></div><div><dt>Service</dt><dd>{booking.service}</dd></div><div className="booking-detail-wide"><dt>Project location</dt><dd><Icon name="pin" />{booking.location}</dd></div></dl><p className="booking-footnote">Dates include the first and last rental day. Confirm handover and collection times with your provider.</p></section>

          <section className="rental-detail-panel" aria-labelledby="rental-terms-title"><div className="booking-section-heading"><span className="booking-section-icon"><Icon name="file" /></span><div><span className="booking-overline">THE AGREEMENT</span><h2 id="rental-terms-title">Rental terms & inclusions</h2></div></div><p className="booking-section-description">These are the provider’s notes from the quote you accepted.</p><div className="booking-terms">{booking.terms || 'No additional terms were supplied with this quote. Confirm delivery, fuel, operator, deposit and return arrangements with your provider.'}</div><div className="booking-project-notes"><h3>Your project notes</h3><p>{booking.notes || 'No additional project notes were provided.'}</p></div></section>

          <section className="rental-detail-panel" aria-labelledby="booking-contacts-title"><div className="booking-section-heading"><span className="booking-section-icon"><Icon name="user" /></span><div><span className="booking-overline">THE PEOPLE</span><h2 id="booking-contacts-title">Project contacts</h2></div></div><div className="booking-contact-grid"><div><span className="booking-overline">RENTER</span><h3>{booking.renterName}</h3><a href={`mailto:${booking.renterEmail}`}><Icon name="mail" />{booking.renterEmail}</a></div><div><span className="booking-overline">PROVIDER</span><h3>{booking.vendor}</h3>{booking.ownerName && <p>{booking.ownerName}</p>}{booking.ownerEmail ? <a href={`mailto:${booking.ownerEmail}`}><Icon name="mail" />{booking.ownerEmail}</a> : <p>Coordinated by the ServiceLoop team.</p>}</div></div></section>
        </div>

        <aside className="booking-sidebar" aria-label="Booking summary"><section className="booking-price-card"><span className="booking-overline">YOUR AGREED QUOTE</span><div className="booking-total">{money(booking.agreedAmount)}</div><p>Total for {booking.days} {booking.days === 1 ? 'day' : 'days'} · {booking.currency}</p><dl><div><dt>Quote accepted</dt><dd>{bookingDate(booking.acceptedAt)}</dd></div><div><dt>Payment</dt><dd>Not collected</dd></div><div><dt>Date reservation</dt><dd><ReservationBadge key={booking.serverTime} booking={booking} /></dd></div></dl><div className="booking-price-note"><Icon name="file" /><p>The accepted quote is saved here. Only the inclusions stated in the rental terms have been agreed.</p></div></section><section className="booking-next"><span className="booking-overline">BEFORE YOUR RENTAL</span><h2>A few details to settle.</h2><ul><li><Icon name="calendar" /><span>Confirm availability and handover times.</span></li><li><Icon name="truck" /><span>Agree on delivery and collection arrangements.</span></li><li><Icon name="file" /><span>Clarify any deposit, fuel and operating requirements.</span></li></ul></section><div className="booking-actions"><button className="button button-outline" onClick={() => window.print()}><Icon name="print" />Print booking details</button><Link className="text-link" to="/bookings">Back to your bookings<Icon name="arrow" /></Link></div></aside></div>
        <p className="booking-record-note"><Icon name="shield" />{booking.imported ? 'Added from an earlier accepted quote. Equipment and contact details reflect the information available when this record was created.' : 'These details were saved when the quote was accepted. Later listing changes do not change this record.'}</p>
      </>}
  </main>;
}
