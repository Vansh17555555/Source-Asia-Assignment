"use client";

import BookingWizard from "@/components/BookingWizard";

export default function SearchPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Decorative header */}
      <div className="bg-slate-900 h-64 w-full absolute top-0 z-0">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
      </div>
      
      <div className="relative z-10 pt-10">
        <BookingWizard />
      </div>
    </div>
  );
}
