import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/Icons';
import { Breadcrumbs } from '../components/PageElements';
import { ReservationBadge } from '../components/BookingReservation';
import { useBookingDetails } from '../hooks/useBookingDetails';
import { bookingDate } from '../hooks/useBookingClock';
import { useMarketplace } from '../state/marketplaceContext';
import { BookingArtwork } from './BookingPage';
import type { Booking } from '../state/marketplaceContext';
import './booking-inspections.css';

type Stage = 'handover' | 'return';
const checklists: Record<Stage, { title: string; detail: string }[]> = {
  handover: [
    { title: 'Equipment matches the booking', detail: 'Check the model, capacity and identifying details.' },
    { title: 'Condition inspected together', detail: 'Note existing marks, wear or damage before collection.' },
    { title: 'Accessories and attachments checked', detail: 'Count the keys, tools and items included in the rental.' },
    { title: 'Operating and safety instructions reviewed', detail: 'Confirm operating requirements with the provider.' },
  ],
  return: [
    { title: 'Equipment inspected on return', detail: 'Compare its condition with the original handover record.' },
    { title: 'Accessories and attachments accounted for', detail: 'Check the keys, tools and other included items.' },
    { title: 'Meter and fuel readings reviewed', detail: 'Record the readings where they apply to this equipment.' },
    { title: 'Any differences documented', detail: 'Describe new wear, damage or missing items for review.' },
  ],
};

function InspectionChecklist({ stage }: { stage: Stage }) {
  const returning = stage === 'return';
  // Deliberately read-only until payment and server-authorized rental lifecycle
  // transitions exist. No submit handlers, upload handlers or local draft storage.
  return <section className="inspection-form-card" aria-labelledby="inspection-form-title" aria-describedby="inspection-lock-description">
    <header className="inspection-card-heading"><span className="inspection-section-icon"><Icon name="file" /></span><div><span className="inspection-overline">{returning ? 'RENTER RECORDS · OWNER REVIEWS' : 'OWNER RECORDS · RENTER REVIEWS'}</span><h2 id="inspection-form-title">{returning ? 'Return inspection' : 'Handover inspection'}</h2></div><span className="inspection-preview-label">Checklist preview</span></header>
    <p className="inspection-card-description">{returning ? 'A shared record of the equipment coming back. Review it together before closing the rental.' : 'Capture the starting condition together, so both sides know exactly what is being handed over.'}</p>

    <fieldset disabled className="inspection-fieldset"><legend><span>01</span>Condition & included items</legend><div className="inspection-fieldset-content">
      <div className="inspection-field-label" id="condition-label">Equipment condition</div><div className="inspection-condition-options" role="group" aria-labelledby="condition-label">
        <label><input type="radio" name="condition" value="good" /><span><Icon name="shield" /><strong>{returning ? 'Matches handover condition' : 'Good working condition'}</strong><small>{returning ? 'No new issues to note' : 'Ready for the agreed work'}</small></span></label>
        <label><input type="radio" name="condition" value="issues" /><span><Icon name="file" /><strong>{returning ? 'Changes or issues to note' : 'Wear or damage to note'}</strong><small>Describe the details below</small></span></label>
      </div>
      <label className="inspection-field">Condition notes<textarea rows={3} maxLength={2000} placeholder={returning ? 'Describe any changes since handover, including damage or missing parts…' : 'Describe the equipment condition, existing marks and anything both parties should know…'} /></label>
      <label className="inspection-field">Accessories & attachments<textarea rows={2} maxLength={1000} placeholder="List included keys, tools, attachments and their condition…" /></label>
      <div className="inspection-readings"><label className="inspection-field">Meter reading <span className="inspection-optional">Optional</span><input type="number" min="0" step="0.1" placeholder="Not recorded" /></label><label className="inspection-field">Meter unit<select defaultValue=""><option value="" disabled>Select unit</option><option value="hours">Engine hours</option><option value="km">Kilometres</option></select></label><label className="inspection-field">Fuel level <span className="inspection-optional">Optional</span><select defaultValue=""><option value="" disabled>Not recorded</option><option>Empty</option><option>¼ tank</option><option>½ tank</option><option>¾ tank</option><option>Full</option><option>Not applicable</option></select></label></div>
    </div></fieldset>

    <fieldset disabled className="inspection-fieldset"><legend><span>02</span>Inspection photos</legend><div className="inspection-fieldset-content"><p className="inspection-field-hint">{returning ? 'Capture the same angles as the handover photos, plus any changes.' : 'Include an overall view, attachments, meter readings and any existing damage.'}</p><label className="inspection-photo-placeholder"><Icon name="camera" /><strong>Add inspection photos</strong><span>Photo uploads will open with the inspection.</span><input className="sr-only" type="file" accept="image/*" multiple aria-label="Inspection photos" /><span className="inspection-photo-lock"><Icon name="lock" />Currently locked</span></label></div></fieldset>

    <fieldset disabled className="inspection-fieldset"><legend><span>03</span>{returning ? 'Before signing off' : 'Before equipment leaves'}</legend><div className="inspection-fieldset-content inspection-checklist">{checklists[stage].map(item => <label key={item.title}><input type="checkbox" /><span><strong>{item.title}</strong><small>{item.detail}</small></span></label>)}</div></fieldset>
    <footer className="inspection-form-footer"><p><Icon name="lock" />This checklist is a preview. Nothing has been recorded.</p><button type="button" className="button button-green" disabled aria-describedby="inspection-lock-description"><Icon name="lock" />{returning ? 'Submit return inspection' : 'Record handover'}</button></footer>
  </section>;
}

function InspectionWorkspace({ booking, stage }: { booking: Booking; stage: Stage }) {
  const { user } = useMarketplace();
  const returning = stage === 'return', cancelled = booking.status === 'CANCELLED';
  const provider = booking.ownerId === user?.id;
  const steps = returning ? [
    { title: 'Renter records the return', detail: 'Add condition notes, readings and photos.' },
    { title: 'Owner checks the equipment', detail: 'Review the equipment and any differences together.' },
    { title: 'Owner acknowledges receipt', detail: 'Confirm the return to complete the rental.' },
  ] : [
    { title: 'Owner prepares the record', detail: 'Add the condition, readings and included items.' },
    { title: 'Renter reviews the inspection', detail: 'Check the record against the equipment received.' },
    { title: 'Renter acknowledges receipt', detail: 'Confirm collection to begin the rental.' },
  ];

  return <>
    <header className={`inspection-hero ${returning ? 'inspection-hero-return' : ''}`}><div><span className="inspection-hero-eyebrow"><span />{returning ? '02 / THE RETURN' : '01 / THE HANDOVER'}</span><h1>{returning ? <>Bring it back.<br /><em>Close the loop.</em></> : <>A smooth start.<br /><em>A shared record.</em></>}</h1><p>{returning ? 'The final checks. The full picture. A clear end to your rental.' : 'A few thoughtful checks for a confident start to your rental.'}</p></div><div className="inspection-date-card"><Icon name={returning ? 'return' : 'truck'} /><span>{returning ? 'LAST AGREED RENTAL DAY' : 'AGREED RENTAL START'}</span><strong>{bookingDate(returning ? booking.end : booking.start)}</strong><small>{booking.days} {booking.days === 1 ? 'day' : 'days'} · Nigeria time (WAT)</small><p>Arrange the exact {returning ? 'return' : 'collection'} time with your {provider ? 'renter' : 'provider'}.</p></div></header>

    <section className="inspection-equipment" aria-label="Your booked equipment"><BookingArtwork booking={booking} /><div><span className="booking-reference">{booking.reference}</span><h2>{booking.title}</h2><p><Icon name="pin" />{booking.location}<span className="inspection-equipment-divider">·</span>{provider ? `For ${booking.renterName}` : `With ${booking.vendor}`}</p></div><Link to={`/bookings/${booking.id}`} className="text-link">Booking details<Icon name="arrow" /></Link></section>

    <nav className="inspection-stage-nav" aria-label="Handover and return views"><Link to={`/bookings/${booking.id}/handover`} aria-current={!returning ? 'page' : undefined}><span>01</span><Icon name="truck" />Equipment handover<Icon name="lock" /></Link><Link to={`/bookings/${booking.id}/return`} aria-current={returning ? 'page' : undefined}><span>02</span><Icon name="return" />Equipment return<Icon name="lock" /></Link></nav>

    <section className={`inspection-lock-notice ${cancelled ? 'inspection-lock-cancelled' : ''}`} aria-labelledby="inspection-lock-title"><span className="inspection-lock-icon"><Icon name="lock" /></span><div><span className="inspection-overline">{cancelled ? 'BOOKING CANCELLED' : 'PAYMENT & CONFIRMATION REQUIRED'}</span><h2 id="inspection-lock-title">{cancelled ? 'This booking is cancelled.' : 'A preview now. A shared record later.'}</h2><p id="inspection-lock-description">{cancelled ? 'Handover and return actions are unavailable for this cancelled booking. These checklists are for reference only.' : 'Payments are not available yet. Recording inspections, uploading photos and confirming receipt will open after payment and booking confirmation.'}</p></div><span className="inspection-locked-badge"><Icon name="lock" />{cancelled ? 'Cancelled' : 'Locked until payment'}</span></section>

    <div className="inspection-workspace"><div className="inspection-main">
      {returning && <section className="inspection-comparison" aria-labelledby="inspection-comparison-title"><div><span className="inspection-section-icon"><Icon name="file" /></span><div><span className="inspection-overline">YOUR STARTING POINT</span><h2 id="inspection-comparison-title">Compare with handover</h2></div></div><p>No handover inspection has been recorded for this booking.</p><dl><div><dt>Starting condition</dt><dd>Not recorded</dd></div><div><dt>Meter reading</dt><dd>Not recorded</dd></div><div><dt>Fuel level</dt><dd>Not recorded</dd></div></dl><Link to={`/bookings/${booking.id}/handover`} className="text-link">Review handover checklist<Icon name="arrow" /></Link></section>}
      <InspectionChecklist stage={stage} />
    </div><aside className="inspection-sidebar" aria-label="Inspection guidance">
      <section className="inspection-journey"><span className="inspection-overline">WHEN THIS STEP OPENS</span><h2>{returning ? <>A clear finish,<br />for both sides.</> : <>Checked together.<br />Ready to go.</>}</h2><ol>{steps.map((step, index) => <li key={step.title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{step.title}</h3><p>{step.detail}</p></div></li>)}</ol><div className="inspection-signoff"><Icon name="lock" /><strong>{returning ? 'Owner acknowledgement' : 'Renter acknowledgement'}</strong><p>{returning ? 'The owner will review the return inspection before acknowledging equipment receipt.' : 'The renter will review the handover inspection before acknowledging equipment receipt.'}</p><button type="button" className="button button-outline" disabled aria-describedby="inspection-lock-description">{returning ? 'Confirm return received' : 'Confirm equipment received'}</button><small>Not recorded</small></div></section>
      <section className="inspection-reservation"><span className="inspection-overline">YOUR BOOKING TODAY</span><h2>Keep your dates in view.</h2><ReservationBadge key={booking.serverTime} booking={booking} /><p>A reservation is a temporary hold. Opening these checklists does not extend or confirm it.</p><Link className="text-link" to={`/bookings/${booking.id}`}>View reservation<Icon name="arrow" /></Link></section>
      <section className="inspection-tip"><Icon name="camera" /><div><h3>Same angles. Clearer comparisons.</h3><p>When inspections open, photograph all sides, attachments and any marks before and after the rental.</p></div></section>
    </aside></div>
    <div className="inspection-bottom"><Link className="text-link" to={`/bookings/${booking.id}`}><Icon name="arrow" />Back to booking</Link><p><Icon name="shield" />Both parties will be able to review the same inspection record.</p></div>
  </>;
}

export default function BookingInspectionPage({ stage }: { stage: Stage }) {
  const { id } = useParams();
  const { booking, loading, error, missing, retry } = useBookingDetails(id);
  const title = stage === 'return' ? 'Equipment return' : 'Equipment handover';
  return <main id="main" tabIndex={-1} className={`inspection-page inspection-page-${stage}`}><div className="container">
    <Breadcrumbs items={[{ label: 'Bookings', to: '/bookings' }, { label: booking?.reference || 'Booking details', to: `/bookings/${encodeURIComponent(id || '')}` }, { label: title }]} />
    {loading ? <div className="inspection-page-state" role="status"><Icon name="file" /><h1>Opening your checklist…</h1><p>Getting the booking details together.</p></div>
      : error ? <div className="inspection-page-state" role="alert"><Icon name="lock" /><h1>{missing ? 'Booking not found.' : 'We couldn’t load this checklist.'}</h1><p>{missing ? 'Check the link and make sure you are signed in to the right account.' : error}</p><div>{!missing && <button type="button" className="button button-green" onClick={retry}>Try again</button>}<Link className="button button-outline" to="/bookings">Back to bookings</Link></div></div>
        : booking?.equipmentId === null ? <div className="inspection-page-state"><Icon name="user" /><h1>This is a service booking.</h1><p>There is no equipment to hand over or return. Coordinate the service details with your provider.</p><Link className="button button-green" to={`/bookings/${booking.id}`}>Back to booking</Link></div>
          : booking && <InspectionWorkspace booking={booking} stage={stage} />}
  </div></main>;
}
