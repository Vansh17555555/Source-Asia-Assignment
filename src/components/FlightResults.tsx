"use client";

import { useEffect, useState } from "react";
import { useFlightStore } from "@/store/useFlightStore";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { Flight } from "@/types";
import { Plane, Clock, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";

export default function FlightResults() {
  const { searchQuery, setSelectedFlight, setBookingStep } = useFlightStore();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchFlights = async () => {
      if (!searchQuery) return;
      
      const { data, error } = await supabase
        .from('flights')
        .select('*')
        .eq('origin', searchQuery.origin)
        .eq('destination', searchQuery.destination)
        .gte('departs_at', `${searchQuery.date}T00:00:00Z`)
        .lte('departs_at', `${searchQuery.date}T23:59:59Z`)
        .order('departs_at', { ascending: true });

      if (data) {
        setFlights(data);
      }
      setLoading(false);
    };

    fetchFlights();
  }, [searchQuery, supabase]);

  const handleSelectFlight = (flightId: string) => {
    setSelectedFlight(flightId);
    setBookingStep(3);
  };

  const calculateDuration = (start: string, end: string) => {
    const diff = differenceInMinutes(new Date(end), new Date(start));
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <Loader2 className="animate-spin text-primary-500 mb-4" size={40} />
        <p className="text-slate-500 font-medium">Finding the best flights...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-8 md:p-12"
    >
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setBookingStep(1)}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Select a Flight</h2>
          <p className="text-slate-500">
            {searchQuery?.origin} to {searchQuery?.destination} • {searchQuery?.date && format(new Date(searchQuery.date), 'MMM dd, yyyy')} • {searchQuery?.passengers} Passenger(s)
          </p>
        </div>
      </div>

      {flights.length === 0 ? (
        <div className="text-center p-12 bg-slate-50 rounded-2xl border border-slate-100">
          <Plane size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No flights found</h3>
          <p className="text-slate-500 mb-6">We couldn't find any flights matching your criteria.</p>
          <button 
            onClick={() => setBookingStep(1)}
            className="text-primary-600 font-medium hover:underline"
          >
            Change search criteria
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {flights.map((flight, index) => (
            <motion.div
              key={flight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-primary-200 transition-all flex flex-col md:flex-row items-center justify-between gap-6 group"
            >
              <div className="flex flex-1 items-center gap-8 w-full">
                <div className="text-center min-w-[80px]">
                  <p className="text-2xl font-bold text-slate-900">{format(new Date(flight.departs_at), 'HH:mm')}</p>
                  <p className="text-sm font-medium text-slate-500">{flight.origin}</p>
                </div>
                
                <div className="flex-1 flex flex-col items-center">
                  <div className="flex items-center text-slate-400 text-sm font-medium mb-1">
                    <Clock size={14} className="mr-1" />
                    {calculateDuration(flight.departs_at, flight.arrives_at)}
                  </div>
                  <div className="w-full flex items-center">
                    <div className="h-[2px] flex-1 bg-slate-200"></div>
                    <Plane size={16} className="text-primary-500 mx-2" />
                    <div className="h-[2px] flex-1 bg-slate-200"></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{flight.flight_no}</p>
                </div>

                <div className="text-center min-w-[80px]">
                  <p className="text-2xl font-bold text-slate-900">{format(new Date(flight.arrives_at), 'HH:mm')}</p>
                  <p className="text-sm font-medium text-slate-500">{flight.destination}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                <div>
                  <p className="text-sm text-slate-500">From</p>
                  <p className="text-2xl font-bold text-slate-900">${flight.base_price}</p>
                </div>
                <button
                  onClick={() => handleSelectFlight(flight.id)}
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors ml-auto flex items-center gap-2 group-hover:shadow-md"
                >
                  Select <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
