import { useEffect, useState } from 'react';
import type { Booking } from '../state/marketplaceContext';

export function useBookingClock() {
  const [tick, setTick] = useState(() => performance.now());
  useEffect(() => {
    const update = () => setTick(performance.now());
    const timer = window.setInterval(update, 1000);
    window.addEventListener('focus', update);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', update); };
  }, []);
  return tick;
}

// Use the server clock and the original API receipt time, including when a
// cached booking is mounted later. Changing the device clock cannot extend a hold.
export function bookingTiming(booking: Booking, tick: number) {
  const elapsed = Math.max(0, tick - (booking.receivedAt ?? tick));
  const now = Date.parse(booking.serverTime) + elapsed;
  const remaining = booking.reservationExpiresAt ? Math.max(0, Date.parse(booking.reservationExpiresAt) - now) : 0;
  const state: Booking['reservationState'] = booking.status === 'CANCELLED' ? 'CANCELLED'
    : booking.equipmentId === null ? 'NOT_APPLICABLE' : !booking.reservationExpiresAt ? 'NONE'
    : remaining > 0 ? 'HELD' : 'EXPIRED';
  return { state, remaining, now };
}

export function holdDuration(remaining: number) {
  const seconds = Math.ceil(remaining / 1000);
  return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60]
    .map(value => String(value).padStart(2, '0')).join(':');
}

const dateFormat = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Lagos' });
export const bookingDate = (value: string) => dateFormat.format(new Date(value.length === 10 ? `${value}T00:00:00Z` : value));
export const reservationLabels: Record<Booking['reservationState'], string> = {
  HELD: 'Dates reserved', EXPIRED: 'Reservation expired', CANCELLED: 'Cancelled',
  NONE: 'Dates not reserved', NOT_APPLICABLE: 'Service to coordinate',
};
