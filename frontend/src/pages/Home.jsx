import { Link } from "react-router-dom";
import {
  Search,
  Building2,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="bg-gray-50 min-h-[calc(100vh-65px)] flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="max-w-7xl mx-mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6">
            <span>✨ The Next-Gen Venue Booking Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Book the Perfect Space or List Your Property with{" "}
            <span className="text-indigo-600">Zero Friction</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Discover verified event spaces, negotiate terms in real-time over
            WebSockets, and lock in dates with absolute double-booking
            protection.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            <Link
              to="/venues"
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 transition"
            >
              <Search className="w-5 h-5" />
              Explore Spaces
            </Link>
            <Link
              to="/register"
              className="px-6 py-3.5 bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm transition"
            >
              List Your Space
              <ArrowRight className="w-4 h-4 text-gray-500" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-200/60 w-full">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">
              2dsphere Spatial Search
            </h3>
            <p className="text-sm text-gray-600">
              Find venues relative to your exact coordinates using MongoDB
              geospatial radius indexing.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">
              Live Price Negotiation
            </h3>
            <p className="text-sm text-gray-600">
              Submit counter-offers and chat directly with venue owners in
              real-time via WebSockets.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">
              ACID Conflict Lock
            </h3>
            <p className="text-sm text-gray-600">
              Guaranteed single-tenant scheduling that prevents overlapping date
              reservations automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-200 text-center text-xs text-gray-500 bg-white">
        © {new Date().getFullYear()} GatherSpace. All rights reserved.
      </footer>
    </div>
  );
}
