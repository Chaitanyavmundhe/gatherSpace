import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import {
  Building2,
  Users,
  IndianRupee,
  Pencil,
  Trash2,
  PlusCircle,
  CalendarCheck,
  CheckCircle2,
  Printer,
  Clock,
  Banknote,
  Video,
} from "lucide-react";

export default function MyVenues() {
  const [activeTab, setActiveTab] = useState("venues"); // 'venues' | 'reservations'
  const [venues, setVenues] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  
  // Receipt Modal state
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [markingPaidId, setMarkingPaidId] = useState(null);

  const navigate = useNavigate();

  const fetchMyVenues = async () => {
    setLoading(true);
    try {
      const res = await API.get("/venues/my");
      setVenues(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your venues");
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await API.get("/bookings/lister");
      setReservations(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch lister reservations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyVenues();
    fetchReservations();
  }, []);

  const handleDelete = async (venueId) => {
    if (
      !window.confirm("Delete this venue permanently? This cannot be undone.")
    ) {
      return;
    }

    setDeletingId(venueId);
    try {
      await API.delete(`/venues/${venueId}`);
      setVenues((prev) => prev.filter((v) => v._id !== venueId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete venue");
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkPaymentDone = async (bookingId) => {
    setMarkingPaidId(bookingId);
    try {
      const res = await API.post(`/bookings/${bookingId}/mark-paid`);
      const updatedBooking = res.data.data;
      
      // Update local state
      setReservations((prev) =>
        prev.map((b) => (b._id === bookingId ? updatedBooking : b))
      );

      // Open receipt modal
      if (res.data.receipt) {
        setActiveReceipt(res.data.receipt);
      } else {
        fetchReceipt(bookingId);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark payment as done");
    } finally {
      setMarkingPaidId(null);
    }
  };

  const fetchReceipt = async (bookingId) => {
    try {
      const res = await API.get(`/bookings/${bookingId}/receipt`);
      setActiveReceipt(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load receipt details");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Tabs */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lister Dashboard</h1>
            <p className="text-sm text-gray-500">
              Manage your venues, offline cash collections, and official receipts
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1">
              <button
                onClick={() => setActiveTab("venues")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === "venues"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                My Venues ({venues.length})
              </button>
              <button
                onClick={() => setActiveTab("reservations")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "reservations"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                Reservations & Receipts ({reservations.length})
              </button>
            </div>

            <button
              onClick={() => navigate("/create-venue")}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition"
            >
              <PlusCircle className="w-4 h-4" />
              List New Venue
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm bg-red-50 text-red-600 p-3 rounded-lg">
            {error}
          </p>
        )}

        {/* TAB 1: VENUES LIST */}
        {activeTab === "venues" && (
          loading ? (
            <p className="text-center text-gray-500 py-12">
              Loading your venues...
            </p>
          ) : venues.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">
                You haven't listed any venues yet.
              </p>
              <Link
                to="/create-venue"
                className="text-indigo-600 font-semibold text-sm hover:text-indigo-800"
              >
                List your first space →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((v) => (
                <div
                  key={v._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{v.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {v.description}
                    </p>

                    {v.location?.formattedAddress && (
                      <p className="text-xs text-gray-400 mt-1.5">
                        {v.location.formattedAddress}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        Cap: {v.capacity}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-gray-900">
                        <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                        {v.pricePerDay.toLocaleString("en-IN")}/day
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => navigate(`/negotiate/room_${v._id}?startCall=true`)}
                      className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-extrabold text-xs transition shadow-xs"
                      title="Start or join video meeting for this space"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Video Call
                    </button>
                    <button
                      onClick={() => navigate(`/edit-venue/${v._id}`)}
                      className="flex items-center justify-center gap-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-2 rounded-lg font-semibold text-xs transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(v._id)}
                      disabled={deletingId === v._id}
                      className="flex items-center justify-center gap-1 bg-red-50 text-red-700 hover:bg-red-100 py-2 rounded-lg font-semibold text-xs transition disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {deletingId === v._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* TAB 2: RESERVATIONS & OFFLINE CASH PAYMENTS */}
        {activeTab === "reservations" && (
          loading ? (
            <p className="text-center text-gray-500 py-12">
              Loading reservations...
            </p>
          ) : reservations.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <CalendarCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                No venue reservations have been made yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((resItem) => {
                const isPaid = resItem.paymentStatus === "paid";
                const startDateStr = new Date(resItem.startDate).toISOString().split("T")[0];
                const endDateStr = new Date(resItem.endDate).toISOString().split("T")[0];

                return (
                  <div
                    key={resItem._id}
                    className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-gray-900">
                          {resItem.venue?.title || "Venue Space"}
                        </span>
                        {isPaid ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> PAID (Cash Collected)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" /> UNPAID (Cash Pending)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 font-medium">
                        <span>
                          Organizer: <strong>{resItem.organizer?.name || "Organizer Client"}</strong> ({resItem.organizer?.email})
                        </span>
                        <span>
                          Dates: <strong className="font-mono text-gray-800">{startDateStr} to {endDateStr}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right font-mono">
                        <span className="block text-[10px] uppercase font-bold text-gray-400">Total Offline Cash</span>
                        <span className="text-lg font-black text-emerald-600">
                          ₹{resItem.totalPrice.toLocaleString("en-IN")}
                        </span>
                      </div>

                      {!isPaid ? (
                        <button
                          onClick={() => handleMarkPaymentDone(resItem._id)}
                          disabled={markingPaidId === resItem._id}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition disabled:opacity-50"
                        >
                          <Banknote className="w-4 h-4" />
                          {markingPaidId === resItem._id ? "Processing..." : "Mark Payment Done (Collect Cash)"}
                        </button>
                      ) : (
                        <button
                          onClick={() => fetchReceipt(resItem._id)}
                          className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-4 py-2.5 rounded-xl transition"
                        >
                          <Printer className="w-4 h-4" />
                          View / Print Receipt
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Official Payment Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
                <h3 className="font-extrabold text-lg text-gray-900">GatherSpace Payment Receipt</h3>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full font-mono">
                PAID & VERIFIED
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
                  <span className="text-gray-400">Payment Date:</span>
                  <span>{new Date(activeReceipt.paidAt || Date.now()).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment Mode:</span>
                  <span className="uppercase font-bold text-emerald-700">Offline Cash</span>
                </div>
              </div>

              <div className="space-y-2 border-t pt-3">
                <h4 className="font-bold text-gray-400 uppercase text-[10px] tracking-wider">
                  Reservation Details
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
                  <span>Total Cash Collected:</span>
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

