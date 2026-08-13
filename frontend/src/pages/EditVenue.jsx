import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import VenueForm from "../components/VenueForm";
import { useAuth } from "../context/AuthContext";

export default function EditVenue() {
  const { venueId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const res = await API.get(`/venues/${venueId}`);
        const fetched = res.data.data;

        // Guard: only the owning lister may edit this venue.
        // (Backend also enforces this on save; this just avoids showing
        // someone else's venue in the form.)
        if (fetched.owner !== user?.id) {
          setError("You don't have permission to edit this venue.");
          setLoading(false);
          return;
        }

        setVenue(fetched);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load venue");
      } finally {
        setLoading(false);
      }
    };
    fetchVenue();
  }, [venueId, user]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center text-gray-500 text-sm">
        Loading venue...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-sm bg-red-50 text-red-600 p-3 rounded-lg">{error}</p>
        <button
          onClick={() => navigate("/my-venues")}
          className="text-sm text-indigo-600 font-semibold hover:text-indigo-800"
        >
          Back to My Venues
        </button>
      </div>
    );
  }

  return <VenueForm venueId={venueId} initialData={venue} />;
}
