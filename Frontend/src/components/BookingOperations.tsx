import { Link } from 'react-router-dom';
import { Icon } from './Icons';
import type { Booking } from '../state/marketplaceContext';
import './booking-operations.css';

export default function BookingOperations({ booking }: { booking: Booking }) {
  if (booking.equipmentId === null) return null;
  const cancelled = booking.status === 'CANCELLED';
  return <section className="booking-operations" aria-labelledby="booking-operations-heading">
    <div className="operations-intro"><span className="operations-symbol"><Icon name="truck" /></span><div><span className="booking-overline">FROM COLLECTION TO COMPLETION</span><h2 id="booking-operations-heading">Handover & returns</h2><p>{cancelled ? 'This booking is cancelled. You can still review the inspection checklists.' : 'Get familiar with the checks for collection and return.'}</p></div><span className="operations-lock"><Icon name="lock" />{cancelled ? 'Booking cancelled' : 'Locked until payment'}</span></div>
    <div className="operations-links">
      <Link to={`/bookings/${booking.id}/handover`}><span className="operations-step">01</span><div><h3>Equipment handover</h3><p>Condition, accessories and collection checks</p></div><Icon name="arrow" /></Link>
      <Link to={`/bookings/${booking.id}/return`}><span className="operations-step">02</span><div><h3>Equipment return</h3><p>Return condition and owner acknowledgement</p></div><Icon name="arrow" /></Link>
    </div>
    <p className="operations-footnote"><Icon name="lock" />Recording inspections and confirming receipt will open after payments are enabled and the booking is confirmed.</p>
  </section>;
}
