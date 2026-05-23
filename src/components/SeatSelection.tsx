"use client";

import { useEffect, useState } from "react";
import { useFlightStore } from "@/store/useFlightStore";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import type { Seat as SeatType } from "@/types";
import { ArrowLeft, ArrowRight, Loader2, Armchair } from "lucide-react";

export default function SeatSelection() {
  const { selectedFlightId, selectedSeatId, setSelectedSeat, setBookingStep } = useFlightStore();
  const [seats, setSeats] = useState<SeatType[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchSeats = async () => {
      if (!selectedFlightId) return;
      
      const { data, error } = await supabase
        .from('seats')
        .select('*')
        .eq('flight_id', selectedFlightId)
        .order('seat_number', { ascending: true });

      if (data) {
        setSeats(data);
      }
      setLoading(false);
    };

    fetchSeats();

    // Set up Realtime subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'seats',
          filter: `flight_id=eq.${selectedFlightId}`
        },
        (payload) => {
          setSeats((currentSeats) => 
            currentSeats.map(seat => 
              seat.id === payload.new.id ? (payload.new as SeatType) : seat
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedFlightId, supabase]);

  const handleSeatClick = (seat: SeatType) => {
    if (!seat.is_available) return;
    
    // Optimistic update in store
    setSelectedSeat(seat.id);
  };

  const getSeatColor = (seat: SeatType) => {
    if (seat.id === selectedSeatId) return "bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-600/30 scale-110";
    if (!seat.is_available) return "bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed opacity-50";
    if (seat.class === 'first') return "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 hover:border-amber-300";
    if (seat.class === 'business') return "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300";
    return "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300";
  };

  const selectedSeatData = seats.find(s => s.id === selectedSeatId);

  // Group seats by row
  const seatGrid: { [key: string]: SeatType[] } = {};
  seats.forEach(seat => {
    const row = seat.seat_number.replace(/[A-Z]/g, '');
    if (!seatGrid[row]) seatGrid[row] = [];
    seatGrid[row].push(seat);
  });
  
  // Sort rows
  const sortedRows = Object.keys(seatGrid).sort((a, b) => parseInt(a) - parseInt(b));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <Loader2 className="animate-spin text-primary-500 mb-4" size={40} />
        <p className="text-slate-500 font-medium">Loading seat map...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col md:flex-row min-h-[600px]"
    >
      {/* Left side: Seat Map */}
      <div className="flex-1 p-8 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto max-h-[70vh] md:max-h-none">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setBookingStep(2)}
            className="p-2 bg-white hover:bg-slate-100 rounded-full transition-colors text-slate-600 shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">Select Your Seat</h2>
        </div>

        <div className="max-w-xs mx-auto">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-8 text-sm font-medium text-slate-600 justify-center">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-amber-100 border border-amber-200"></div> First Class</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-indigo-50 border border-indigo-200"></div> Business</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-white border border-slate-200"></div> Economy</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-primary-600"></div> Selected</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-slate-200 opacity-50"></div> Occupied</div>
          </div>

          <div className="bg-white p-6 rounded-[3rem] border-8 border-slate-200 shadow-xl relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-200 rounded-b-xl"></div>
            
            <div className="flex flex-col gap-6 mt-4">
              {sortedRows.map(row => {
                const rowSeats = seatGrid[row].sort((a, b) => a.seat_number.localeCompare(b.seat_number));
                const leftSide = rowSeats.filter(s => ['A', 'B', 'C'].includes(s.seat_number.replace(/[0-9]/g, '')));
                const rightSide = rowSeats.filter(s => ['D', 'E', 'F'].includes(s.seat_number.replace(/[0-9]/g, '')));

                return (
                  <div key={row} className="flex justify-between items-center relative">
                    <div className="flex gap-2">
                      {leftSide.map(seat => (
                        <Seat key={seat.id} seat={seat} onClick={() => handleSeatClick(seat)} colorClass={getSeatColor(seat)} />
                      ))}
                    </div>
                    <div className="w-8 text-center text-xs font-bold text-slate-400 absolute left-1/2 -translate-x-1/2">{row}</div>
                    <div className="flex gap-2">
                      {rightSide.map(seat => (
                        <Seat key={seat.id} seat={seat} onClick={() => handleSeatClick(seat)} colorClass={getSeatColor(seat)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Selection details */}
      <div className="w-full md:w-80 p-8 bg-white flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-6">Selection Summary</h3>
          
          {selectedSeatData ? (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center font-bold text-lg">
                    {selectedSeatData.seat_number}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 capitalize">{selectedSeatData.class}</p>
                    <p className="text-sm text-slate-500">Seat selection</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-4 mt-2">
                <span className="text-slate-600">Extra Fee</span>
                <span className="font-bold text-slate-900">${selectedSeatData.extra_fee}</span>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <Armchair size={32} className="mx-auto text-slate-400 mb-3" />
              <p className="text-slate-500 font-medium">Please select a seat from the map</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setBookingStep(4)}
          disabled={!selectedSeatId}
          className="mt-8 w-full bg-primary-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-md shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Continue to Details <ArrowRight size={20} />
        </button>
      </div>
    </motion.div>
  );
}

function Seat({ seat, onClick, colorClass }: { seat: SeatType, onClick: () => void, colorClass: string }) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={!seat.is_available}
        className={`w-8 h-10 rounded-t-lg rounded-b-sm border-2 transition-all flex items-center justify-center text-xs font-bold ${colorClass}`}
      >
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">{seat.seat_number.replace(/[0-9]/g, '')}</span>
      </button>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 hidden md:block">
        Seat {seat.seat_number} ({seat.class})
        {seat.extra_fee > 0 && ` - +$${seat.extra_fee}`}
        {!seat.is_available && " - Occupied"}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
      </div>
    </div>
  );
}
