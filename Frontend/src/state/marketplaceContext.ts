import {createContext,useContext} from 'react';
import type {Equipment} from '../data';
export type Account = { id: string; name: string; email: string; role: 'CUSTOMER' | 'OWNER' | 'ADMIN' };
export type RentalRequest = { id: string; title: string; service: string; location: string; start: string; days: number; name: string; email: string; notes: string; estimate: number | null; equipmentId: number | null; status: 'SUBMITTED' | 'QUOTED' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED'; quotedAmount: number | null; quoteNotes: string | null; updatedAt: string; booking: { id: string; reference: string } | null };
export type RequestPatch = { status: RentalRequest['status']; quotedAmount?: number; quoteNotes?: string; expectedUpdatedAt?: string };
export type Booking = {
  id: string; reference: string; requestId: string; renterId: string; ownerId: string | null; equipmentId: number | null;
  title: string; service: string; equipmentCategory: string | null; capacity: string | null; image: string;
  equipmentLocation: string | null; operator: boolean | null; vendor: string; ownerName: string | null; ownerEmail: string | null;
  renterName: string; renterEmail: string; location: string; start: string; end: string; days: number;
  agreedAmount: number; currency: 'NGN'; terms: string; notes: string; status: 'AWAITING_CONFIRMATION' | 'CANCELLED'; acceptedAt: string; imported: boolean;
  reservedAt: string | null; reservationExpiresAt: string | null; cancelledAt: string | null;
  reservationState: 'NONE' | 'HELD' | 'EXPIRED' | 'CANCELLED' | 'NOT_APPLICABLE'; serverTime: string; holdHours: number;
  receivedAt?: number;
};
export type RequestInput = { title: string; service?: string; location: string; start: string; days: number; name: string; email: string; notes: string; equipmentId?: number };
export type Marketplace = {
  catalog: Equipment[]; saved: number[]; savedEquipment: Equipment[]; requests: RentalRequest[]; bookings: Booking[]; ownEquipment: Equipment[];
  user: Account | null; sessionLoading: boolean; catalogLoading: boolean; catalogError: string; workspaceLoading: boolean; workspaceError: string;
  signIn: (email: string, password: string) => Promise<void>; register: (values: { name: string; email: string; password: string; role: 'CUSTOMER' | 'OWNER' }) => Promise<void>; signOut: () => Promise<void>;
  toggleSave: (id: number) => void; addRequest: (input: RequestInput) => Promise<string>;
  updateRequest: (id: string, patch: RequestPatch) => Promise<RentalRequest>;
  removeRequest: (id: string) => Promise<void>; addEquipment: (item: Omit<Equipment, 'id' | 'status'>) => Promise<number>;
  removeEquipment: (id: number) => Promise<void>; notify: (message: string) => void;
  reloadCatalog: () => Promise<void>; reloadWorkspace: () => Promise<void>;
};
export const MarketplaceContext = createContext<Marketplace | null>(null);

export function useMarketplace(){const context=useContext(MarketplaceContext);if(!context)throw new Error('MarketplaceProvider is required.');return context;}
