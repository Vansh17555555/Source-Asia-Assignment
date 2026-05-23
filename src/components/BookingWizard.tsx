"use client";

import { useFlightStore } from "@/store/useFlightStore";
import { useUserStore } from "@/store/useUserStore";
import SearchForm from "./SearchForm";
import FlightResults from "./FlightResults";
import SeatSelection from "./SeatSelection";
import PassengerForm from "./PassengerForm";
import Confirmation from "./Confirmation";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BookingWizard() {
  const { bookingStep } = useFlightStore();
  const { session } = useUserStore();
  const router = useRouter();

  // If user reaches passenger form but not logged in, redirect to login
  // Actually, we can prompt them to login. Let's just render the step.

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex justify-between items-center relative max-w-3xl mx-auto">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0 rounded-full" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary-500 z-0 rounded-full transition-all duration-500"
            style={{ width: `${((bookingStep - 1) / 4) * 100}%` }}
          />
          
          {[1, 2, 3, 4, 5].map((step) => (
            <div 
              key={step}
              className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full font-bold transition-colors duration-300 ${
                bookingStep >= step 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30' 
                  : 'bg-white text-slate-400 border-2 border-slate-200'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center max-w-3xl mx-auto mt-3 text-sm font-medium text-slate-500 hidden sm:flex">
          <span className={bookingStep >= 1 ? 'text-primary-600' : ''}>Search</span>
          <span className={bookingStep >= 2 ? 'text-primary-600' : ''}>Flights</span>
          <span className={bookingStep >= 3 ? 'text-primary-600' : ''}>Seats</span>
          <span className={bookingStep >= 4 ? 'text-primary-600' : ''}>Details</span>
          <span className={bookingStep >= 5 ? 'text-primary-600' : ''}>Done</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden min-h-[500px]">
        {bookingStep === 1 && <SearchForm />}
        {bookingStep === 2 && <FlightResults />}
        {bookingStep === 3 && <SeatSelection />}
        {bookingStep === 4 && <PassengerForm />}
        {bookingStep === 5 && <Confirmation />}
      </div>
    </div>
  );
}
