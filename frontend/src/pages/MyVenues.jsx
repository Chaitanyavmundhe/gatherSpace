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
} from "lucide-react";

export default function MyVenues() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
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

  useEffect(() => {
    fetchMyVenues();
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Venues</h1>
            <p className="text-sm text-gray-500">
              Manage the spaces you've listed
            </p>
          </div>
          <button
            onClick={() => navigate("/create-venue")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            List a New Venue
          </button>
        </div>

        {error && (
          <p className="text-sm bg-red-50 text-red-600 p-3 rounded-lg">
            {error}
          </p>
        )}

        {loading ? (
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

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => navigate(`/edit-venue/${v._id}`)}
                    className="flex items-center justify-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-2 rounded-lg font-semibold text-xs transition"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(v._id)}
                    disabled={deletingId === v._id}
                    className="flex items-center justify-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 py-2 rounded-lg font-semibold text-xs transition disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deletingId === v._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
