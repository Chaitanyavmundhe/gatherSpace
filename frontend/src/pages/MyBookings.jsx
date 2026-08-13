import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import { io } from "socket.io-client";
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  Printer,
  Building2,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function MyBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [realtimeNotice, setRealtimeNotice] = useState("");

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const res = await API.get("/bookings/my");
      setBookings(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your reservations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();

    // Listen for real-time payment approval via WebSocket
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5050";
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("payment_approved", (data) => {
      // Check if approved booking belongs to this organizer
      setBookings((prev) =>
        prev.map((b) =>
          b._id === data.bookingId
            ? { ...b, paymentStatus: "paid", transactionId: data.receipt?.transactionId }
            : b
        )
      );

      setRealtimeNotice(
        `🎉 Payment for "${data.venueTitle || "your reservation"}" has been approved by the lister! View your receipt below.`
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleFetchReceipt = async (bookingId) => {
    try {
      const res = await API.get(`/bookings/${bookingId}/receipt`);
      setActiveReceipt(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load payment receipt");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/venues")}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarCheck className="w-6 h-6 text-indigo-600" />
                My Venue Reservations
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Track Lister offline cash approval status and view official receipts
            </p>
          </div>

          <button
            onClick={() => navigate("/venues")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition"
          >
            Discover More Venues
          </button>
        </div>

        {/* Real-time Payment Approval Toast Notification */}
        {realtimeNotice && (
          <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-md flex items-center justify-between font-medium text-sm animate-bounce">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 shrink-0" />
              <span>{realtimeNotice}</span>
            </div>
            <button
              onClick={() => setRealtimeNotice("")}
              className="text-xs bg-emerald-700 hover:bg-emerald-800 px-3 py-1 rounded-lg font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <p className="text-sm bg-red-50 text-red-600 p-3 rounded-lg">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-center text-gray-500 py-12">
            Loading your venue reservations...
          </p>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 space-y-3">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-gray-500 text-sm font-medium">
              You haven't reserved any venue spaces yet.
            </p>
            <Link
              to="/venues"
              className="inline-block text-indigo-600 font-bold text-sm hover:text-indigo-800"
            >
              Browse available spaces →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const isApproved = booking.paymentStatus === "paid";
              const startDateStr = new Date(booking.startDate).toISOString().split("T")[0];
              const endDateStr = new Date(booking.endDate).toISOString().split("T")[0];

              return (
                <div
                  key={booking._id}
                  className={`bg-white p-6 rounded-2xl shadow-xs border transition flex flex-wrap items-center justify-between gap-4 ${
                    isApproved ? "border-emerald-200 bg-emerald-50/20" : "border-gray-100"
                  }`}
                >
                  <div className="space-y-2 max-w-lg">
                    <div className="flex items-center gap-3">
                      <h3 className="font-extrabold text-lg text-gray-900">
                        {booking.venue?.title || "Reserved Venue"}
                      </h3>
                      {isApproved ? (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 flex items-center gap-1.5 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Payment Approved by Lister
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 flex items-center gap-1.5 border border-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Lister Approval
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-600 space-y-1 font-medium">
                      <div>
                        Reserved Dates: <strong className="font-mono text-gray-800">{startDateStr} to {endDateStr}</strong>
                      </div>
                      {!isApproved ? (
                        <p className="text-amber-800 bg-amber-50 p-2 rounded-lg text-[11px]">
                          💬 Pay <strong>₹{booking.totalPrice?.toLocaleString("en-IN")}</strong> in cash directly to the lister upon arrival. Your receipt will unlock here as soon as the lister approves the payment.
                        </p>
                      ) : (
                        <p className="text-emerald-800 bg-emerald-50 p-2 rounded-lg text-[11px] font-semibold">
                          🎉 Lister confirmed cash payment. Official payment receipt is ready to view & download.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right font-mono">
                      <span className="block text-[10px] uppercase font-bold text-gray-400">Payable Amount</span>
                      <span className="text-xl font-black text-gray-900">
                        ₹{booking.totalPrice?.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {isApproved ? (
                      <button
                        onClick={() => handleFetchReceipt(booking._id)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs transition"
                      >
                        <Printer className="w-4 h-4" />
                        View / Download Receipt
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex items-center gap-2 bg-gray-100 text-gray-400 font-bold text-xs px-4 py-2.5 rounded-xl cursor-not-allowed border border-gray-200"
                        title="Receipt will unlock as soon as Lister marks payment done"
                      >
                        <Clock className="w-4 h-4" />
                        Receipt Pending Approval
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Official Payment Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
                <h3 className="font-extrabold text-lg text-gray-900">Official Payment Receipt</h3>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full font-mono">
                PAID & APPROVED
              </span>
            </div>

            <div id="payment-receipt" className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 font-mono text-gray-700 border border-slate-200/60">
                <div className="flex justify-between">
                  <span className="text-gray-400">Receipt Ref:</span>
                  <span className="font-bold text-gray-900">{activeReceipt.receiptId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Transaction ID:</span>
                  <span className="font-bold text-indigo-600">{activeReceipt.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Approval Date:</span>
                  <span>{new Date(activeReceipt.paidAt || Date.now()).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment Status:</span>
                  <span className="uppercase font-bold text-emerald-700">APPROVED (Offline Cash)</span>
                </div>
              </div>

              <div className="space-y-2 border-t pt-3">
                <h4 className="font-bold text-gray-400 uppercase text-[10px] tracking-wider">
                  Reservation Summary
                </h4>
                <div className="flex justify-between">
                  <span className="text-gray-600">Venue Space:</span>
                  <span className="font-bold text-gray-900">{activeReceipt.venueTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Organizer:</span>
                  <span className="font-semibold text-gray-800">{activeReceipt.organizerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in / Check-out:</span>
                  <span className="font-mono font-semibold text-gray-800">
                    {activeReceipt.startDate} to {activeReceipt.endDate} ({activeReceipt.days} days)
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 border-t pt-3 font-mono">
                <div className="flex justify-between text-gray-600">
                  <span>Daily Rate:</span>
                  <span>₹{Number(activeReceipt.pricePerDay || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-gray-900 border-t pt-2">
                  <span>Total Cash Paid:</span>
                  <span className="text-emerald-600">₹{Number(activeReceipt.totalPrice || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print / Save Receipt
              </button>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs transition text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
