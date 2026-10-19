import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { equipment, readStorage, writeStorage } from '../data';
import type { Equipment } from '../data';

export type RentalRequest = { id: string; title: string; location: string; start: string; days: number; name: string; email: string; notes: string; estimate?: number; equipmentId?: number };
type Marketplace = {
  catalog: Equipment[]; saved: number[]; requests: RentalRequest[]; ownEquipment: Equipment[];
  toggleSave: (id: number) => void; addRequest: (request: Omit<RentalRequest, 'id'>) => string;
  removeRequest: (id: string) => void; addEquipment: (item: Omit<Equipment, 'id'>) => number;
  removeEquipment: (id: number) => void; clearDemo: () => void; notify: (message: string) => void;
};
const MarketplaceContext = createContext<Marketplace | null>(null);
export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<number[]>(() => readStorage('sl-saved', []));
  const [requests, setRequests] = useState<RentalRequest[]>(() => readStorage('sl-requests', []));
  const [ownEquipment, setOwnEquipment] = useState<Equipment[]>(() => readStorage('sl-equipment', []));
  const [notification, notify] = useState('');
  useEffect(() => writeStorage('sl-saved', saved), [saved]);
  useEffect(() => writeStorage('sl-requests', requests), [requests]);
  useEffect(() => writeStorage('sl-equipment', ownEquipment), [ownEquipment]);
  useEffect(() => { if (!notification) return; const timer = setTimeout(() => notify(''), 4000); return () => clearTimeout(timer); }, [notification]);
  const toggleSave = (id: number) => setSaved(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]);
  const addRequest = (request: Omit<RentalRequest, 'id'>) => { const id = `SL-${crypto.randomUUID().slice(0,8).toUpperCase()}`; setRequests(previous => [{ ...request, id }, ...previous]); return id; };
  const addEquipment = (item: Omit<Equipment, 'id'>) => { const id = Date.now(); setOwnEquipment(previous => [...previous, { ...item, id }]); return id; };
  const removeRequest = (id: string) => { setRequests(previous => previous.filter(item => item.id !== id)); notify('Request draft removed.'); };
  const removeEquipment = (id: number) => { setOwnEquipment(previous => previous.filter(item => item.id !== id)); setSaved(previous => previous.filter(value => value !== id)); notify('Sample listing removed.'); };
  const clearDemo = () => { setSaved([]); setRequests([]); setOwnEquipment([]); notify('Your local demo data has been cleared.'); };
  return <MarketplaceContext.Provider value={{ catalog: [...equipment, ...ownEquipment], saved, requests, ownEquipment, toggleSave, addRequest, removeRequest, addEquipment, removeEquipment, clearDemo, notify }}>{children}{notification && <div className="toast" role="status">{notification}</div>}</MarketplaceContext.Provider>;
}
export function useMarketplace() { const context = useContext(MarketplaceContext); if (!context) throw new Error('MarketplaceProvider is required.'); return context; }
