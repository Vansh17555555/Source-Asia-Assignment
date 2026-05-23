import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SearchQuery {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
}

export interface PassengerDetails {
  full_name: string;
  passport_no: string;
  nationality: string;
  dob: string;
}

interface FlightStoreState {
  searchQuery: SearchQuery | null;
  selectedFlightId: string | null;
  selectedSeatId: string | null;
  bookingStep: number;
  passengerDetails: PassengerDetails | null;
  
  setSearchQuery: (query: SearchQuery) => void;
  setSelectedFlight: (flightId: string) => void;
  setSelectedSeat: (seatId: string) => void;
  setBookingStep: (step: number) => void;
  setPassengerDetails: (details: PassengerDetails) => void;
  resetBooking: () => void;
}

export const useFlightStore = create<FlightStoreState>()(
  persist(
    (set) => ({
      searchQuery: null,
      selectedFlightId: null,
      selectedSeatId: null,
      bookingStep: 1, // 1: Search, 2: Flights, 3: Seats, 4: Passenger Details, 5: Confirmation
      passengerDetails: null,

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedFlight: (flightId) => set({ selectedFlightId: flightId }),
      setSelectedSeat: (seatId) => set({ selectedSeatId: seatId }),
      setBookingStep: (step) => set({ bookingStep: step }),
      setPassengerDetails: (details) => set({ passengerDetails: details }),
      resetBooking: () => set({
        searchQuery: null,
        selectedFlightId: null,
        selectedSeatId: null,
        bookingStep: 1,
        passengerDetails: null,
      }),
    }),
    {
      name: 'flight-storage',
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedFlightId: state.selectedFlightId,
        selectedSeatId: state.selectedSeatId,
        bookingStep: state.bookingStep,
        // Persist everything except passport number
        passengerDetails: state.passengerDetails
          ? { ...state.passengerDetails, passport_no: '' }
          : null,
      }),
    }
  )
);
