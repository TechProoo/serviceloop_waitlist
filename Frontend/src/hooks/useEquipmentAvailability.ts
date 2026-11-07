import { useEffect, useState } from 'react';
import { api, errorMessage } from '../api/client';

type Availability = { start: string; end: string; available: boolean; reason: 'RESERVED' | 'UNAVAILABLE' | null; checkedAt: string; holdHours: number };
export function useEquipmentAvailability(equipmentId: number | undefined, start: string, days: number) {
  const [attempt, setAttempt] = useState(0);
  const key = `${equipmentId}:${start}:${days}:${attempt}`;
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(start) && Number.isInteger(days) && days >= 1 && days <= 365;
  const [result, setResult] = useState<{ key: string; data?: Availability; error?: string } | null>(null);
  useEffect(() => {
    if (!equipmentId || !valid) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      void api<Availability>(`/equipment/${equipmentId}/availability?${new URLSearchParams({ start, days: String(days) })}`, { signal: controller.signal })
        .then(data => { if (!controller.signal.aborted) setResult({ key, data }); })
        .catch(error => { if (!controller.signal.aborted) setResult({ key, error: errorMessage(error) }); });
    }, 250);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [equipmentId, start, days, key, valid]);
  useEffect(() => {
    const refresh = () => setAttempt(value => value + 1);
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);
  const current = result?.key === key ? result : null;
  const state = !valid ? 'invalid' : !current ? 'checking' : current.error ? 'error' : current.data?.available ? 'available' : 'unavailable';
  return { state, data: current?.data, error: current?.error, retry: () => setAttempt(value => value + 1), canRequest: state === 'available' };
}
