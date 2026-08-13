import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";
import { Building2, PlusCircle, LogOut, LogIn, MapPin, Video, PhoneCall, X } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    if (!user) return;

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5050";
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("incoming_video_call", (data) => {
      // Don't notify the caller themselves
      if (data.callerName !== user.name) {
        setIncomingCall(data);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {/* Global Incoming Video Call Notification Toast */}
      {incomingCall && (
        <div className="bg-indigo-900 text-white px-6 py-2.5 flex items-center justify-between shadow-md border-b border-indigo-700 animate-pulse text-xs font-semibold">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-emerald-400 animate-bounce" />
            <span>
              📹 <strong>{incomingCall.callerName}</strong> ({incomingCall.callerRole}) started a Live Video Call for <strong>{incomingCall.venueTitle}</strong>!
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const room = incomingCall.roomId;
                setIncomingCall(null);
                navigate(`/negotiate/${room}?startCall=true`);
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-3 py-1 rounded-lg transition shadow-xs flex items-center gap-1 text-xs"
            >
              <Video className="w-3.5 h-3.5" /> Join Video Call Now
            </button>
            <button
              onClick={() => setIncomingCall(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <nav className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-xl text-indigo-600"
        >
          <Building2 className="w-6 h-6" />
          <span>GatherSpace</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/venues"
            className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-indigo-600 transition"
          >
            <MapPin className="w-4 h-4" />
            Explore Spaces
          </Link>

          {user && (
            <Link
              to="/negotiations"
              className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
            >
              <Video className="w-4 h-4 text-indigo-600" />
              Negotiations & Video Calls
            </Link>
          )}

          {user?.role?.toLowerCase() === "organizer" && (
            <Link
              to="/my-bookings"
              className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-indigo-600 transition"
            >
              <Building2 className="w-4 h-4 text-indigo-600" />
              My Reservations
            </Link>
          )}

          {user?.role?.toLowerCase() === "lister" && (
            <>
              <Link
                to="/my-venues"
                className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-indigo-600 transition"
              >
                <Building2 className="w-4 h-4" />
                My Venues
              </Link>
              <Link
                to="/create-venue"
                className="flex items-center gap-1 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
              >
                <PlusCircle className="w-4 h-4" />
                List Venue
              </Link>
            </>
          )}

          {user ? (
            <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
              <Link
                to="/profile"
                className="text-right hover:opacity-75 transition"
                title="Edit profile"
              >
                <p className="text-sm font-semibold text-gray-800 leading-tight">
                  {user.name}
                </p>
                <span className="text-[10px] font-mono uppercase bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                  {user.role}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}

