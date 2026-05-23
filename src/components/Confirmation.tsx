"use client";

import { useEffect, useState } from "react";
import { useFlightStore } from "@/store/useFlightStore";
import { useUserStore } from "@/store/useUserStore";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { Booking } from "@/types";
import { CheckCircle2, Download, ArrowRight, Plane, Loader2 } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function Confirmation() {
  const { resetBooking, passengerDetails } = useFlightStore();
  const { session } = useUserStore();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchLatestBooking = async () => {
      if (!session) return;
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          flights (*),
          seats (*)
        `)
        .eq('user_id', session.user.id)
        .order('booked_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setBooking(data);
      }
      setLoading(false);
    };

    fetchLatestBooking();
  }, [session, supabase]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <Loader2 className="animate-spin text-primary-500 mb-4" size={40} />
        <p className="text-slate-500 font-medium">Generating your ticket...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center p-20">
        <p className="text-red-500">Could not retrieve booking details.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 md:p-12 max-w-3xl mx-auto"
    >
      <div className="text-center mb-10">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
          className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 size={40} />
        </motion.div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
        <p className="text-slate-500 text-lg">Your flight has been successfully booked.</p>
      </div>

      <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 relative overflow-hidden">
        {/* Ticket cutouts */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-slate-50 rounded-full border-r-2 border-slate-200"></div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 bg-slate-50 rounded-full border-l-2 border-slate-200"></div>

        <div className="flex flex-col md:flex-row justify-between items-center pb-8 border-b-2 border-dashed border-slate-200">
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-1">PNR Code</p>
            <p className="text-4xl font-black text-primary-600 tracking-widest">{booking.pnr_code}</p>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-1">Status</p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700">
              CONFIRMED
            </span>
          </div>
        </div>

        <div className="py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="col-span-2 md:col-span-1">
            <p className="text-sm text-slate-500 mb-1">Passenger</p>
            <p className="font-bold text-slate-900">{passengerDetails?.full_name || 'Passenger'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Flight</p>
            <p className="font-bold text-slate-900">{booking.flights.flight_no}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Seat</p>
            <p className="font-bold text-slate-900">{booking.seats.seat_number}</p>
            <p className="text-xs text-slate-500 capitalize">{booking.seats.class}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Date</p>
            <p className="font-bold text-slate-900">{format(new Date(booking.flights.departs_at), 'MMM dd, yyyy')}</p>
          </div>
        </div>

        <div className="pt-8 border-t-2 border-dashed border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900">{format(new Date(booking.flights.departs_at), 'HH:mm')}</p>
              <p className="text-sm font-medium text-slate-500">{booking.flights.origin}</p>
            </div>
            <div className="flex flex-col items-center px-4">
              <Plane size={24} className="text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900">{format(new Date(booking.flights.arrives_at), 'HH:mm')}</p>
              <p className="text-sm font-medium text-slate-500">{booking.flights.destination}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500 mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-slate-900">${booking.total_price}</p>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
        <Link 
          href="/my-bookings"
          onClick={() => resetBooking()}
          className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
        >
          View All Bookings <ArrowRight size={20} />
        </Link>
        <button 
          className="bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
          onClick={() => window.print()}
        >
          <Download size={20} /> Download Ticket
        </button>
      </div>
    </motion.div>
  );
}
