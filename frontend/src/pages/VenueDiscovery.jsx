import { useState, useEffect } from "react";
import API from "../api/axios";
import { MapPin, Search, Users, IndianRupee } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function VenueDiscovery() {
  const [longitude, setLongitude] = useState(75.3433); // Chhatrapati Sambhajinagar default
  const [latitude, setLatitude] = useState(19.8762);
  const [distance, setDistance] = useState(50); // Radius in km
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const res = await API.get(
        `/venues/radius/${longitude}/${latitude}/${distance}`,
      );
      setVenues(res.data.data);
    } catch (err) {
      console.error("Error fetching venues:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header & Spatial Filter Controls */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Discover Venues
            </h1>
            <p className="text-sm text-gray-500">
              Real-time geospatial search backed by MongoDB 2dsphere
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 px-3 py-2 rounded-lg">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-20 bg-transparent text-sm font-mono focus:outline-none"
                placeholder="Lng"
              />
              <span className="text-gray-400">,</span>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-20 bg-transparent text-sm font-mono focus:outline-none"
                placeholder="Lat"
              />
            </div>

            <select
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="bg-gray-100 px-3 py-2 rounded-lg text-sm focus:outline-none"
            >
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="100">Within 100 km</option>
            </select>

            <button
              onClick={fetchVenues}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition"
            >
              <Search className="w-4 h-4" />
              Find Spaces
            </button>
          </div>
        </div>

        {/* Venue Cards Grid */}
        {loading ? (
          <p className="text-center text-gray-500 py-12">
            Querying spatial index...
          </p>
        ) : venues.length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            No venues found within {distance} km of target coordinates.
          </p>
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
                    onClick={() => navigate(`/negotiate/room_${v._id}`)}
                    className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-2 rounded-lg font-semibold text-xs transition"
                  >
                    Negotiate
                  </button>
                  <button
                    onClick={() => navigate(`/book/${v._id}`)}
                    className="bg-emerald-600 text-white hover:bg-emerald-700 py-2 rounded-lg font-semibold text-xs transition"
                  >
                    Reserve Now
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
