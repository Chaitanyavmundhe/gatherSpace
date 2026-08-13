import { useState, useEffect, useCallback } from "react";
import API from "../api/axios";
import { Search, Users, IndianRupee, Map } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DiscoveryMap from "../components/DiscoveryMap";

export default function VenueDiscovery() {
  const [longitude, setLongitude] = useState(75.3433); // Chhatrapati Sambhajinagar default
  const [latitude, setLatitude] = useState(19.8762);
  const [distance, setDistance] = useState(50); // Radius in km
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchVenues = useCallback(async (lng = longitude, lat = latitude, dist = distance) => {
    setLoading(true);
    try {
      const res = await API.get(
        `/venues/radius/${lng}/${lat}/${dist}`,
      );
      setVenues(res.data.data);
    } catch (err) {
      console.error("Error fetching venues:", err);
    } finally {
      setLoading(false);
    }
  }, [longitude, latitude, distance]);

  const handleLocationChange = (newLat, newLng) => {
    setLatitude(newLat);
    setLongitude(newLng);
    fetchVenues(newLng, newLat, distance);
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
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Map className="w-6 h-6 text-indigo-600" />
              Discover Venues
            </h1>
            <p className="text-sm text-gray-500">
              Interactive map location selection & geospatial radius search
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={distance}
              onChange={(e) => {
                const newDist = e.target.value;
                setDistance(newDist);
                fetchVenues(longitude, latitude, newDist);
              }}
              className="bg-gray-100 px-4 py-2.5 rounded-lg text-sm font-medium focus:outline-none border border-gray-200"
            >
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="100">Within 100 km</option>
            </select>

            <button
              onClick={() => fetchVenues(longitude, latitude, distance)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition"
            >
              <Search className="w-4 h-4" />
              Refresh Venues
            </button>
          </div>
        </div>

        {/* Interactive Map Picker Component */}
        <DiscoveryMap
          latitude={latitude}
          longitude={longitude}
          distance={distance}
          venues={venues}
          onLocationChange={handleLocationChange}
        />

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
