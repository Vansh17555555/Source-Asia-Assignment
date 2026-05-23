"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store/useUserStore";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { Booking } from "@/types";
import { Plane, Calendar, XCircle, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { format, differenceInHours } from "date-fns";
import RescheduleModal from "@/components/RescheduleModal";

export default function MyBookings() {
  const { session } = useUserStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<any | null>(null);
  const supabase = createClient();

  const fetchBookings = async () => {
    if (!session) return;
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        flights (*),
        seats (*)
      `)
      .eq('user_id', session.user.id)
      .order('booked_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, [session, supabase]);

  const handleCancel = async (bookingId: string, flightTime: string) => {
    const hoursUntilFlight = differenceInHours(new Date(flightTime), new Date());
    if (hoursUntilFlight < 2) {
      alert("Cancellations are not allowed within 2 hours of departure.");
      return;
    }

    if (!confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) {
      return;
    }

    setProcessingId(bookingId);
    setError(null);

    const { error } = await supabase.rpc('cancel_booking', {
      p_booking_id: bookingId
    });

    if (error) {
      setError(error.message);
    } else {
      // Refresh bookings
      fetchBookings();
    }
    setProcessingId(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary-500 mb-4" size={40} />
        <p className="text-slate-500 font-medium">Loading your bookings...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-slate-500 mb-4">Please log in to view your bookings.</p>
        <a href="/login" className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700">Login</a>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">My Bookings</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {rescheduleBooking && (
        <RescheduleModal 
          booking={rescheduleBooking} 
          isOpen={!!rescheduleBooking} 
          onClose={() => setRescheduleBooking(null)} 
          onSuccess={() => { fetchBookings(); setRescheduleBooking(null); }} 
        />
      )}

      {bookings.length === 0 ? (
        <div className="text-center p-16 bg-white rounded-3xl shadow-sm border border-slate-100">
          <Plane size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No bookings found</h3>
          <p className="text-slate-500 mb-6">You haven't booked any flights yet.</p>
          <a href="/search" className="inline-block bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors">
            Book a Flight
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking, i) => {
            const isCancellable = differenceInHours(new Date(booking.flights.departs_at), new Date()) >= 2;
            const isCancelled = booking.status === 'cancelled';
            const isRescheduled = booking.status === 'rescheduled';

            return (
              <motion.div 
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-white rounded-2xl shadow-sm border p-6 flex flex-col md:flex-row gap-6 ${isCancelled ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                      isCancelled ? 'bg-red-100 text-red-700' : 
                      isRescheduled ? 'bg-amber-100 text-amber-700' : 
                      'bg-green-100 text-green-700'
                    }`}>
                      {booking.status}
                    </span>
                    <span className="font-mono font-bold text-slate-500">PNR: {booking.pnr_code}</span>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{format(new Date(booking.flights.departs_at), 'HH:mm')}</p>
                      <p className="font-medium text-slate-500">{booking.flights.origin}</p>
                    </div>
                    <div className="flex-1 flex items-center relative">
                      <div className="h-px bg-slate-300 w-full absolute top-1/2 -translate-y-1/2"></div>
                      <Plane size={20} className="text-slate-400 absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">{format(new Date(booking.flights.arrives_at), 'HH:mm')}</p>
                      <p className="font-medium text-slate-500">{booking.flights.destination}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-6 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      {format(new Date(booking.flights.departs_at), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">Seat:</span> 
                      {booking.seats?.seat_number} ({booking.seats?.class})
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">Price:</span> 
                      ${booking.total_price}
                    </div>
                  </div>
                </div>

                {!isCancelled && (
                  <div className="flex md:flex-col justify-end gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                    <button 
                      className="flex items-center justify-center gap-2 w-full md:w-32 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                      onClick={() => setRescheduleBooking(booking)}
                    >
                      <RefreshCw size={16} /> Reschedule
                    </button>
                    <button 
                      onClick={() => handleCancel(booking.id, booking.flights.departs_at)}
                      disabled={!isCancellable || processingId === booking.id}
                      className="flex items-center justify-center gap-2 w-full md:w-32 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!isCancellable ? "Cannot cancel within 2 hours of departure" : ""}
                    >
                      {processingId === booking.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} 
                      Cancel
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
