import { Icon } from './Icons';
import type { useEquipmentAvailability } from '../hooks/useEquipmentAvailability';
import './availability.css';

export default function DateAvailability({ check }: { check: ReturnType<typeof useEquipmentAvailability> }) {
  const heading = check.state === 'checking' ? 'Checking your dates…' : check.state === 'available' ? 'These dates are available to request'
    : check.state === 'unavailable' ? check.data?.reason === 'RESERVED' ? 'These dates are temporarily reserved' : 'Equipment currently unavailable'
    : check.state === 'invalid' ? 'Choose a date and rental duration' : 'Availability could not be checked';
  const message = check.state === 'available' ? 'A quote request does not hold dates. Accepting a quote reserves them for 2 hours.'
    : check.state === 'unavailable' ? check.data?.reason === 'UNAVAILABLE' ? 'This listing is not taking new requests. Choose another piece of equipment.' : 'Try different dates or check again after the current hold is released.'
    : check.error || 'We check the full rental period, including your last day.';
  return <div className={`date-availability date-availability-${check.state}`} role="status"><Icon name={check.state === 'available' ? 'check' : 'calendar'} /><div><strong>{heading}</strong><p>{message}</p>{['error','unavailable'].includes(check.state) && <button type="button" className="text-link" onClick={check.retry}>Check again<Icon name="arrow" /></button>}</div></div>;
}
