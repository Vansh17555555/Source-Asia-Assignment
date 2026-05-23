"use client";

import { useState } from "react";
import { useFlightStore } from "@/store/useFlightStore";
import { useUserStore } from "@/store/useUserStore";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, User, Globe, CreditCard, Calendar, Loader2 } from "lucide-react";

export default function PassengerForm() {
  const { passengerDetails, setPassengerDetails, setBookingStep, selectedFlightId, selectedSeatId } = useFlightStore();
  const { session } = useUserStore();
  const [formData, setFormData] = useState({
    full_name: passengerDetails?.full_name || "",
    passport_no: passengerDetails?.passport_no || "",
    nationality: passengerDetails?.nationality || "",
    dob: passengerDetails?.dob || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generatePNR = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pnr = '';
    for (let i = 0; i < 6; i++) {
      pnr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pnr;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      setError("You must be logged in to book a flight.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setPassengerDetails(formData);

    try {
      // 1. Get Flight and Seat details for pricing
      const { data: flightData } = await supabase.from('flights').select('base_price').eq('id', selectedFlightId).single();
      const { data: seatData } = await supabase.from('seats').select('extra_fee').eq('id', selectedSeatId).single();
      
      const totalPrice = (flightData?.base_price || 0) + (seatData?.extra_fee || 0);
      const pnr = generatePNR();

      // 2. Call RPC to reserve seat and create booking
      const { data, error: rpcError } = await supabase.rpc('reserve_seat', {
        p_user_id: session.user.id,
        p_flight_id: selectedFlightId,
        p_seat_id: selectedSeatId,
        p_total_price: totalPrice,
        p_pnr_code: pnr,
        p_full_name: formData.full_name,
        p_passport_no: formData.passport_no,
        p_nationality: formData.nationality,
        p_dob: formData.dob
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      // Success, move to confirmation
      setBookingStep(5);

    } catch (err: any) {
      setError(err.message || "Failed to complete booking. The seat might have been taken.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-8 md:p-12 max-w-3xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setBookingStep(3)}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Passenger Details</h2>
          <p className="text-slate-500">Please enter details exactly as they appear on your passport.</p>
        </div>
      </div>

      {!session && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          <p className="font-medium">You are not logged in.</p>
          <p className="text-sm mt-1">Please sign in to complete your booking. Your progress will be saved.</p>
          <a href="/login" className="inline-block mt-3 px-4 py-2 bg-amber-100 text-amber-900 font-medium rounded-lg hover:bg-amber-200 transition-colors">
            Go to Login
          </a>
        </div>
      )}

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Passport Number</label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                name="passport_no"
                required
                value={formData.passport_no}
                onChange={handleChange}
                placeholder="A12345678"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nationality</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                name="nationality"
                required
                value={formData.nationality}
                onChange={handleChange}
                placeholder="e.g. American"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="date"
                name="dob"
                required
                value={formData.dob}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !session}
            className="bg-primary-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-md shadow-primary-600/20 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <><Loader2 className="animate-spin" size={20} /> Processing...</>
            ) : (
              <>Confirm Booking <ArrowRight size={20} /></>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
