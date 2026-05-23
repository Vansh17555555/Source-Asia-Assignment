"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Booking, Flight, Seat } from "@/types";
import { X, Plane, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface RescheduleModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RescheduleModal({ booking, isOpen, onClose, onSuccess }: RescheduleModalProps) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  // Fetch flights on same route
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchAlternativeFlights = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('flights')
        .select('*')
        .eq('origin', booking.flights.origin)
        .eq('destination', booking.flights.destination)
        .gt('departs_at', new Date().toISOString())
        .neq('id', booking.flights.id) // exclude current
        .order('departs_at', { ascending: true });

      if (data) setFlights(data);
      setLoading(false);
    };

    fetchAlternativeFlights();
  }, [isOpen, booking, supabase]);

  // Fetch seats for selected flight
  useEffect(() => {
    if (!selectedFlightId) return;
    
    const fetchSeats = async () => {
      const { data } = await supabase
        .from('seats')
        .select('*')
        .eq('flight_id', selectedFlightId)
        .eq('is_available', true)
        .order('seat_number', { ascending: true });
      if (data) setSeats(data);
    };

    fetchSeats();
  }, [selectedFlightId, supabase]);

  const handleConfirm = async () => {
    if (!selectedFlightId || !selectedSeatId) return;
    setSubmitting(true);
    setError(null);

    try {
      const selectedFlight = flights.find(f => f.id === selectedFlightId);
      const selectedSeat = seats.find(s => s.id === selectedSeatId);
      
      const newBasePrice = selectedFlight?.base_price || 0;
      const newExtraFee = selectedSeat?.extra_fee || 0;
      const newTotalPrice = newBasePrice + newExtraFee;
      
      const currentPrice = booking.total_price;
      const feeCharged = newTotalPrice > currentPrice ? newTotalPrice - currentPrice : 0;

      const { data, error: rpcError } = await supabase.rpc('reschedule_booking', {
        p_booking_id: booking.id,
        p_new_flight_id: selectedFlightId,
        p_new_seat_id: selectedSeatId,
        p_fee_charged: feeCharged
      });

      if (rpcError) throw new Error(rpcError.message);
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to reschedule booking");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">Reschedule Flight</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
          
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">1. Select Alternative Flight</h3>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-500" size={32} /></div>
            ) : flights.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 rounded-xl">No alternative flights available.</div>
            ) : (
              <div className="space-y-3">
                {flights.map(flight => (
                  <button
                    key={flight.id}
                    onClick={() => { setSelectedFlightId(flight.id); setSelectedSeatId(null); }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedFlightId === flight.id ? 'border-primary-500 bg-primary-50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                  >
                    <div className="text-left">
                      <p className="font-bold text-slate-900">{format(new Date(flight.departs_at), 'MMM dd, HH:mm')}</p>
                      <p className="text-sm text-slate-500">{flight.flight_no} • {flight.aircraft_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">${flight.base_price}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedFlightId && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">2. Select New Seat</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {seats.map(seat => (
                  <button
                    key={seat.id}
                    onClick={() => setSelectedSeatId(seat.id)}
                    className={`p-2 rounded-lg border-2 text-sm font-bold transition-all ${selectedSeatId === seat.id ? 'border-primary-500 bg-primary-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                  >
                    {seat.seat_number}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="px-6 py-3 font-medium text-slate-600 hover:bg-slate-200 rounded-xl">Cancel</button>
          <button 
            onClick={handleConfirm}
            disabled={!selectedFlightId || !selectedSeatId || submitting}
            className="px-6 py-3 font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-xl flex items-center gap-2"
          >
            {submitting ? <><Loader2 size={18} className="animate-spin" /> Processing</> : 'Confirm Reschedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
