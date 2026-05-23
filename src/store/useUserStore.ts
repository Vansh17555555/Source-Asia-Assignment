import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Session } from '@supabase/supabase-js';

interface Booking {
  id: string;
  flight_id: string;
  seat_id: string;
  status: string;
  booked_at: string;
  total_price: number;
  pnr_code: string;
  flight: any; // We'll type this properly later or leave as any
  seat: any;
}

interface UserStoreState {
  session: Session | null;
  bookings: Booking[];
  setSession: (session: Session | null) => void;
  setBookings: (bookings: Booking[]) => void;
  resetUserStore: () => void;
}

export const useUserStore = create<UserStoreState>()(
  persist(
    (set) => ({
      session: null,
      bookings: [],
      setSession: (session) => set({ session }),
      setBookings: (bookings) => set({ bookings }),
      resetUserStore: () => set({ session: null, bookings: [] }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        // Only persist session token to avoid stale sensitive data offline
        session: state.session,
      }),
    }
  )
);
