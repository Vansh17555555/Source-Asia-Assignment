import { Plane, WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="relative mb-8">
        <Plane size={64} className="text-slate-300" />
        <WifiOff size={32} className="text-red-500 absolute -bottom-2 -right-2 bg-white rounded-full p-1" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-4">You are offline</h1>
      <p className="text-slate-500 max-w-md mb-8">
        It looks like you've lost your internet connection. You can still view your saved bookings while offline.
      </p>
      <Link 
        href="/my-bookings" 
        className="bg-primary-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-md shadow-primary-600/20"
      >
        View My Bookings
      </Link>
    </div>
  );
}
