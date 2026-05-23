"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, PlaneTakeoff, ShieldCheck, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-50/80 to-slate-50 z-10" />
          {/* Abstract Background Shapes */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] rounded-full bg-primary-200/50 blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] rounded-full bg-blue-200/50 blur-3xl opacity-50" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
                Elevate Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-500">
                  Travel Experience
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl text-slate-600 mb-10 leading-relaxed"
            >
              Discover, book, and manage your flights seamlessly. Experience world-class service with real-time seat selection and instant confirmations.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-white bg-primary-600 rounded-full hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/30 hover:shadow-primary-600/50 hover:-translate-y-1"
              >
                Book a Flight <ArrowRight size={20} />
              </Link>
              <Link
                href="/my-bookings"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-slate-700 bg-white rounded-full hover:bg-slate-50 border border-slate-200 transition-all shadow-sm hover:shadow-md hover:-translate-y-1"
              >
                Manage Bookings
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard
              icon={<PlaneTakeoff size={32} className="text-primary-600" />}
              title="Global Destinations"
              description="Fly to over 500 destinations worldwide with our premium partner airlines."
              delay={0.1}
            />
            <FeatureCard
              icon={<ShieldCheck size={32} className="text-primary-600" />}
              title="Secure Booking"
              description="Bank-level security ensures your personal and payment information is always safe."
              delay={0.2}
            />
            <FeatureCard
              icon={<Clock size={32} className="text-primary-600" />}
              title="Real-time Updates"
              description="Live seat availability and instant confirmations. No double bookings, ever."
              delay={0.3}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay }}
      className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:border-primary-100 transition-all group"
    >
      <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </motion.div>
  );
}
