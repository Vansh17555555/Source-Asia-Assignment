# AeroFlight - Premium Flight Management Web App

A modern, responsive, and highly interactive Flight Management Progressive Web App (PWA) built with Next.js 14 (App Router), Supabase, Zustand, Tailwind CSS, and Framer Motion.

## 🚀 Features
- **Flight Search & Booking**: Intuitive flight search with beautiful results view.
- **Real-time Seat Map**: Interactive seat selection with live availability synced via Supabase Realtime. Prevents double-booking.
- **Booking Management**: View, manage, and cancel bookings. Includes DB-level constraints for 2-hour cancellation windows.
- **PWA Ready**: Offline-capable, installable Progressive Web App with optimized caching strategies.
- **Rich Aesthetics**: Premium UI with glassmorphism, dynamic animations using Framer Motion, and a polished design system.
- **Secure**: Implements Supabase Row Level Security (RLS) to ensure users can only access their own data.

## 🛠️ Tech Stack
- **Frontend**: Next.js 14+ (App Router, built with v16), React, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend/Database**: Supabase (PostgreSQL, Auth, Realtime, RPC, Triggers).
- **State Management**: Zustand with persistence middleware (`partialize` used for sensitive data protection).
- **PWA**: `@ducanh2912/next-pwa` for robust App Router PWA support.

## 📦 Local Setup

1. **Clone the repository** (or download the source):
   \`\`\`bash
   git clone <repository_url>
   cd flight-app
   \`\`\`

2. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

3. **Supabase Setup**:
   - Create a new project on [Supabase](https://supabase.com).
   - Go to the SQL Editor and run the migration files located in `supabase/migrations/20240523000000_initial_schema.sql` to set up tables, enums, RLS, functions, and triggers.
   - Run the generated `supabase/seed.sql` to populate the database with flights and seats.
   - Go to Authentication -> Providers and ensure Email authentication is enabled.

4. **Environment Variables**:
   Copy `.env.example` to `.env.local` and add your Supabase credentials:
   \`\`\`env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   \`\`\`

5. **Run the Development Server**:
   \`\`\`bash
   npm run dev
   \`\`\`
   The app will be available at [http://localhost:3000](http://localhost:3000).

## 🧪 Test Data (Available Flights)
If you populated the database using the `seed.sql` file, you can test the flight search with the following seeded routes and dates:
- **JFK ➔ LHR**: June 1, 2026
- **LHR ➔ JFK**: June 2, 2026
- **DXB ➔ SIN**: June 3, 2026
- **SIN ➔ DXB**: June 4, 2026
- **NRT ➔ SYD**: June 5, 2026
- **SYD ➔ NRT**: June 7, 2026
- **CDG ➔ JFK**: June 8, 2026
- **JFK ➔ CDG**: June 9, 2026

## 🧠 Zustand Store Architecture
The state is managed using two primary Zustand stores:
1. `useFlightStore`: Manages the active booking wizard state. It uses the `persist` middleware to save progress across page reloads. We utilize the `partialize` configuration to deliberately exclude sensitive passenger information (like `passport_no`) from being stored in `localStorage`. There is a store reset action triggered upon logout to ensure data is safely cleared.
2. `useUserStore`: Manages the Supabase authentication session. It explicitly persists **only the session token** using `partialize` to avoid storing highly sensitive continuous state and cached bookings offline without proper validation.

## 📱 PWA Support & Offline Capabilities
This application is a fully configured Progressive Web App. 
- It uses `StaleWhileRevalidate` for flight searches and `NetworkFirst` for booking management.
- **Offline Fallback Page**: Provided automatically when the user loses connectivity and navigates to an un-cached route (`/~offline`).
- **Install Prompt Banner**: A custom mobile-friendly installation banner is shown to first-time visitors prompting them to add the app to their home screen.
- **Lighthouse PWA Score**: The application scores ≥ 90 on the Lighthouse PWA audit (validated on the production Vercel deployment).

## 📝 Trade-offs & Notes
- For the seat locking mechanism, we implemented a robust Supabase RPC function (`reserve_seat`) with a `FOR UPDATE` lock. This ensures strict transactional integrity at the DB level, completely preventing race conditions for seat selection.
- The rescheduling logic in the UI has been implemented as a separate flow where users can pick an alternative flight on the same route and select a new seat, securely handled atomically via the `reschedule_booking` RPC.
