import { useEffect, useState } from 'react';
import { api, ApiError, errorMessage } from '../api/client';
import { useMarketplace } from '../state/marketplaceContext';
import type { Booking } from '../state/marketplaceContext';

export function useBookingDetails(id: string | undefined) {
  const { user } = useMarketplace();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; booking?: Booking; error?: string; missing?: boolean } | null>(null);
  const key = `${user?.id}:${id}:${attempt}`;
  useEffect(() => {
    const refresh = () => setAttempt(value => value + 1);
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void api<Booking>(`/bookings/${encodeURIComponent(id || '')}`, { signal: controller.signal })
      .then(booking => { if (!controller.signal.aborted) setResult({ key, booking: { ...booking, receivedAt: performance.now() } }); })
      .catch(error => { if (!controller.signal.aborted) setResult({ key, error: errorMessage(error), missing: error instanceof ApiError && error.status === 404 }); });
    return () => controller.abort();
  }, [id, key]);
  const current = result?.key === key ? result : undefined;
  return {
    booking: current?.booking, loading: !current, error: current?.error, missing: current?.missing,
    retry: () => setAttempt(value => value + 1),
    updateBooking: (booking: Booking) => setResult({ key, booking: { ...booking, receivedAt: performance.now() } }),
  };
}
