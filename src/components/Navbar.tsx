"use client";

import Link from "next/link";
import { Plane, User, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import { useFlightStore } from "@/store/useFlightStore";
import { createClient } from "@/utils/supabase/client";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { session, setSession } = useUserStore();
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, setSession]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    useUserStore.getState().resetUserStore();
    useFlightStore.getState().resetBooking();
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/80 backdrop-blur-lg shadow-md py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary-600 text-white p-2 rounded-xl group-hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/30">
            <Plane size={24} className="group-hover:-translate-y-1 transition-transform" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
            AeroFlight
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 font-medium">
          <Link href="/search" className="text-slate-600 hover:text-primary-600 transition-colors">
            Book Flight
          </Link>
          {session ? (
            <>
              <Link href="/my-bookings" className="text-slate-600 hover:text-primary-600 transition-colors">
                My Bookings
              </Link>
              <button
                onClick={handleSignOut}
                className="text-slate-600 hover:text-red-500 transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition-all hover:shadow-lg active:scale-95"
            >
              <User size={18} />
              <span>Sign In</span>
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-slate-900"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-xl border-t border-slate-100 flex flex-col p-4 gap-4">
          <Link 
            href="/search" 
            className="p-3 text-slate-700 hover:bg-slate-50 rounded-lg font-medium"
            onClick={() => setMobileMenuOpen(false)}
          >
            Book Flight
          </Link>
          {session ? (
            <>
              <Link 
                href="/my-bookings" 
                className="p-3 text-slate-700 hover:bg-slate-50 rounded-lg font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Bookings
              </Link>
              <button
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className="p-3 text-left text-red-500 hover:bg-red-50 rounded-lg font-medium"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link 
              href="/login" 
              className="p-3 bg-slate-900 text-white rounded-lg font-medium text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
