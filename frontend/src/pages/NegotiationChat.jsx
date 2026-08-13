import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Tag,
  Users,
  Radio,
  ArrowLeft,
  CalendarCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

let socket;

export default function NegotiationChat() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [actionsHistory, setActionsHistory] = useState([]);
  const [presence, setPresence] = useState({
    organizerLive: false,
    listerLive: false,
    users: [],
  });

  const [selectedAction, setSelectedAction] = useState("OFFER");
  const [priceInput, setPriceInput] = useState("");
  const [selectedNote, setSelectedNote] = useState("Standard Daily Rental Rate");
  const [rejectReason, setRejectReason] = useState("Proposed price is outside acceptable budget");

  useEffect(() => {
    const SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5050";

    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    // Protocol Handshake with user details for live presence tracking
    socket.emit("join_room", {
      roomId,
      user: {
        id: user?._id || user?.id,
        name: user?.name || "Guest User",
        role: user?.role || "organizer",
      },
    });

    // Listen for live presence updates
    socket.on("presence_update", (data) => {
      setPresence(data);
    });

    // Listen for structured negotiation actions
    socket.on("receive_negotiation_action", (data) => {
      setActionsHistory((prev) => [...prev, data]);
    });

    // Legacy handler fallback
    socket.on("receive_message", (data) => {
      if (data.actionType) {
        setActionsHistory((prev) => {
          const exists = prev.some(
            (item) =>
              item.timestamp === data.timestamp && item.sender === data.sender
          );
          return exists ? prev : [...prev, data];
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, user]);

  // Extract venue ID if roomId format is room_<venueId>
  const venueId = roomId.startsWith("room_") ? roomId.replace("room_", "") : null;

  const handleSendStructuredAction = (e) => {
    e.preventDefault();

    if (
      (selectedAction === "OFFER" || selectedAction === "COUNTER_OFFER") &&
      (!priceInput || Number(priceInput) <= 0)
    ) {
      alert("Please enter a valid monetary price amount.");
      return;
    }

    const payload = {
      roomId,
      sender: user?.name || "Anonymous User",
      role: user?.role || "organizer",
      actionType: selectedAction,
      offeredPrice:
        selectedAction === "OFFER" || selectedAction === "COUNTER_OFFER"
          ? Number(priceInput)
          : null,
      note:
        selectedAction === "REJECT"
          ? rejectReason
          : selectedAction === "ACCEPT"
          ? "Agreed to proposed terms and pricing."
          : selectedNote,
      timestamp: new Date().toISOString(),
    };

    socket.emit("send_negotiation_action", payload);

    if (selectedAction === "OFFER" || selectedAction === "COUNTER_OFFER") {
      setPriceInput("");
    }
  };

  const getLatestOfferPrice = () => {
    const lastOffer = [...actionsHistory]
      .reverse()
      .find((a) => a.offeredPrice && (a.actionType === "OFFER" || a.actionType === "COUNTER_OFFER"));
    return lastOffer ? lastOffer.offeredPrice : null;
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gray-50 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col h-[680px] overflow-hidden">
        {/* Header with Room ID & Real-Time Presence Badges */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/venues")}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
              title="Back to discovery"
            >
              <ArrowLeft className="w-4 h-4 text-slate-300" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h2 className="font-bold text-base tracking-tight">
                  Structured Negotiation Hub
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Room ID: {roomId}
              </p>
            </div>
          </div>

          {/* User & Lister Live Indicators */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            {/* Organizer Status */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  presence.organizerLive
                    ? "bg-emerald-500 animate-ping"
                    : "bg-gray-500"
                }`}
              ></span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  presence.organizerLive ? "bg-emerald-500" : "bg-gray-500"
                }`}
              ></span>
              <span className="text-slate-200">Organizer:</span>
              <span
                className={
                  presence.organizerLive
                    ? "text-emerald-400 font-bold"
                    : "text-slate-400"
                }
              >
                {presence.organizerLive ? "LIVE" : "Offline"}
              </span>
            </div>

            {/* Lister Status */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  presence.listerLive
                    ? "bg-emerald-500 animate-ping"
                    : "bg-gray-500"
                }`}
              ></span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  presence.listerLive ? "bg-emerald-500" : "bg-gray-500"
                }`}
              ></span>
              <span className="text-slate-200">Lister:</span>
              <span
                className={
                  presence.listerLive
                    ? "text-emerald-400 font-bold"
                    : "text-slate-400"
                }
              >
                {presence.listerLive ? "LIVE" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        {/* Structured Protocol Notice Banner */}
        <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 flex items-center justify-between text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Structured Protocol Enforced:</strong> Unstructured free-text chat is disabled. All interactions are conducted via official Offer, Counter-Offer, Accept, and Reject protocol commands.
            </span>
          </div>
          {venueId && (
            <button
              onClick={() => navigate(`/book/${venueId}`)}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded text-xs transition"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              Reserve Space
            </button>
          )}
        </div>

        {/* Structured Action Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
          {actionsHistory.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-full">
                <Tag className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-gray-600">
                No negotiation protocol actions recorded yet.
              </p>
              <p className="text-xs text-gray-400">
                Use the structured controls below to submit an initial offer or proposal.
              </p>
            </div>
          ) : (
            actionsHistory.map((action, idx) => {
              const isMe = action.sender === user?.name;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl max-w-[85%] border shadow-xs transition ${
                    isMe
                      ? "ml-auto bg-indigo-50/80 border-indigo-200 text-indigo-950"
                      : "bg-white border-gray-200 text-gray-900"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2 pb-2 border-b border-gray-200/60">
                    <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      {action.sender} ({action.role})
                    </span>
                    <span className="font-mono text-[11px]">
                      {new Date(action.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Action Badge & Price Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {action.actionType === "OFFER" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          <Tag className="w-3 h-3" /> Initial Offer
                        </span>
                      )}
                      {action.actionType === "COUNTER_OFFER" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          <TrendingUp className="w-3 h-3" /> Counter Offer
                        </span>
                      )}
                      {action.actionType === "ACCEPT" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Accepted
                        </span>
                      )}
                      {action.actionType === "REJECT" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}

                      {action.offeredPrice && (
                        <span className="text-base font-extrabold text-slate-900 font-mono">
                          ₹{action.offeredPrice.toLocaleString("en-IN")}/day
                        </span>
                      )}
                    </div>

                    {action.note && (
                      <p className="text-xs text-gray-700 bg-white/70 p-2 rounded border border-gray-100">
                        {action.note}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Structured Action Input Bar (Free-form text disabled) */}
        <form
          onSubmit={handleSendStructuredAction}
          className="p-4 bg-white border-t border-gray-200 space-y-3"
        >
          {/* Action Selector Tabs */}
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setSelectedAction("OFFER")}
              className={`py-2 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                selectedAction === "OFFER"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <Tag className="w-3.5 h-3.5" /> Submit Offer
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedAction("COUNTER_OFFER");
                const lastPrice = getLatestOfferPrice();
                if (lastPrice && !priceInput) {
                  setPriceInput(String(lastPrice));
                }
              }}
              className={`py-2 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                selectedAction === "COUNTER_OFFER"
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Counter Offer
            </button>

            <button
              type="button"
              onClick={() => setSelectedAction("ACCEPT")}
              className={`py-2 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                selectedAction === "ACCEPT"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Accept Offer
            </button>

            <button
              type="button"
              onClick={() => setSelectedAction("REJECT")}
              className={`py-2 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                selectedAction === "REJECT"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <XCircle className="w-3.5 h-3.5" /> Reject Offer
            </button>
          </div>

          {/* Inputs tailored to selected structured action */}
          {(selectedAction === "OFFER" || selectedAction === "COUNTER_OFFER") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Proposed Amount (₹ / Day)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Preset Proposal Term / Note
                </label>
                <select
                  value={selectedNote}
                  onChange={(e) => setSelectedNote(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-sm bg-white focus:outline-none"
                >
                  <option value="Standard Daily Rental Rate">Standard Daily Rental Rate</option>
                  <option value="Includes Audiovisual & Stage Equipment">Includes Audiovisual & Stage Equipment</option>
                  <option value="Full Event Setup & Clean-up Package">Full Event Setup & Clean-up Package</option>
                  <option value="Weekend Prime Rate Proposal">Weekend Prime Rate Proposal</option>
                  <option value="Special Discounted Extended Booking">Special Discounted Extended Booking</option>
                </select>
              </div>
            </div>
          )}

          {selectedAction === "ACCEPT" && (
            <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-xs font-semibold flex items-center justify-between">
              <span>
                Confirm acceptance of the active negotiation price proposal:{" "}
                <strong className="font-mono text-emerald-950">
                  ₹{getLatestOfferPrice() ? getLatestOfferPrice().toLocaleString("en-IN") : "---"}/day
                </strong>
              </span>
            </div>
          )}

          {selectedAction === "REJECT" && (
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                Decline Reason Preset
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 border rounded-lg text-sm bg-white focus:outline-none"
              >
                <option value="Proposed price is outside acceptable budget">
                  Proposed price is outside acceptable budget
                </option>
                <option value="Requested dates are not available">
                  Requested dates are not available
                </option>
                <option value="Venue capacity and terms do not match requirements">
                  Venue capacity and terms do not match requirements
                </option>
                <option value="Declined after internal venue review">
                  Declined after internal venue review
                </option>
              </select>
            </div>
          )}

          {/* Submit Protocol Action Button */}
          <button
            type="submit"
            className={`w-full py-3 rounded-xl font-bold text-white text-sm transition shadow-sm ${
              selectedAction === "OFFER"
                ? "bg-blue-600 hover:bg-blue-700"
                : selectedAction === "COUNTER_OFFER"
                ? "bg-purple-600 hover:bg-purple-700"
                : selectedAction === "ACCEPT"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            Transmit Protocol Command ({selectedAction.replace("_", " ")})
          </button>
        </form>
      </div>
    </div>
  );
}

