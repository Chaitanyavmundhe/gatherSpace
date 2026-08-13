import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import {
  Video,
  Building2,
  CalendarCheck,
  Radio,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function MyNegotiations() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customRoomId, setCustomRoomId] = useState("");

  useEffect(() => {
    const fetchRelevantVenues = async () => {
      setLoading(true);
      try {
        if (user?.role === "lister") {
          const res = await API.get("/venues/my");
          setVenues(res.data.data || []);
        } else {
          const res = await API.get("/venues");
          setVenues(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch venues for negotiations hub:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelevantVenues();
  }, [user]);

  const handleJoinCustomRoom = (e) => {
    e.preventDefault();
    if (!customRoomId.trim()) return;
    const formatted = customRoomId.trim().toLowerCase();
    navigate(`/negotiate/${formatted}?startCall=true`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Video className="w-6 h-6 text-indigo-600 animate-pulse" />
              <h1 className="text-2xl font-bold text-gray-900">
                Negotiations & Video Meeting Hub
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Join face-to-face video negotiations or submit rate offer prompts
            </p>
          </div>

          {/* Quick Join by Room Code */}
          <form
            onSubmit={handleJoinCustomRoom}
            className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200"
          >
            <input
              type="text"
              placeholder="Enter Room Code (e.g. room_123)"
              value={customRoomId}
              onChange={(e) => setCustomRoomId(e.target.value)}
              className="bg-transparent px-3 py-1.5 text-xs font-mono focus:outline-none w-48 text-gray-800"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1"
            >
              Join <ArrowRight className="w-3 h-3" />
            </button>
          </form>
        </div>

        {/* Notice Banner */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2 font-extrabold text-sm text-emerald-400">
              <Sparkles className="w-4 h-4" /> Live Video Calls & Instant Rate Approval
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Launch a live video meeting with your participant directly from any room. Once the negotiated rate is agreed upon during your call, the Lister sends the offer prompt, and the Organizer accepts to unlock reservation at the negotiated price!
            </p>
          </div>

          <Link
            to="/venues"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs px-4 py-2.5 rounded-xl transition shadow-xs"
          >
            Browse Available Venues
          </Link>
        </div>

        {/* Room List Grid */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600" />
            {user?.role === "lister" ? "My Listed Venues Negotiation Rooms" : "Available Venue Negotiation Rooms"}
          </h2>

          {loading ? (
            <p className="text-center text-gray-500 py-12">
              Loading negotiation rooms...
            </p>
          ) : venues.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 space-y-3">
              <Building2 className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-gray-500 text-sm">
                No active venues available for negotiation yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {venues.map((v) => {
                const roomId = `room_${v._id}`;
                return (
                  <div
                    key={v._id}
                    className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between space-y-4 hover:shadow-md transition"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-base text-gray-900 line-clamp-1">
                          {v.title}
                        </h3>
                        <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                          ₹{v.pricePerDay.toLocaleString("en-IN")}/day
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {v.description}
                      </p>
                      <div className="text-[11px] font-mono text-gray-400">
                        Room Code: {roomId}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => navigate(`/negotiate/${roomId}?startCall=true`)}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Video className="w-4 h-4" />
                        Start / Join Live Video Call
                      </button>

                      {user?.role === "organizer" && (
                        <button
                          onClick={() => navigate(`/book/${v._id}`)}
                          className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl transition flex items-center gap-1 border border-emerald-200"
                          title="Reserve directly at base listed price"
                        >
                          <CalendarCheck className="w-4 h-4 text-emerald-600" />
                          Reserve Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
