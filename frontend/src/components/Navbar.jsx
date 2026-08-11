import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Building2, PlusCircle, LogOut, LogIn, MapPin } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
      <Link
        to="/venues"
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

        {user?.role?.toLowerCase() === "lister" && (
          <Link
            to="/create-venue"
            className="flex items-center gap-1 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
          >
            <PlusCircle className="w-4 h-4" />
            List Venue
          </Link>
        )}

        {user ? (
          <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800 leading-tight">
                {user.name}
              </p>
              <span className="text-[10px] font-mono uppercase bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                {user.role}
              </span>
            </div>
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
  );
}
