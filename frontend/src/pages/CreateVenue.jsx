import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import { Building2, IndianRupee, Users, MapPin } from "lucide-react";

export default function CreateVenue() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    pricePerDay: "",
    capacity: "",
    longitude: "75.3433",
    latitude: "19.8762",
    address: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const lng = parseFloat(formData.longitude);
    const lat = parseFloat(formData.latitude);

    if (isNaN(lng) || isNaN(lat)) {
      setError("Please enter valid numeric Longitude and Latitude values");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        pricePerDay: Number(formData.pricePerDay),
        capacity: Number(formData.capacity),
        location: {
          type: "Point",
          coordinates: [lng, lat],
          address: formData.address,
        },
      };

      await API.post("/venues", payload);
      navigate("/venues");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create venue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gray-50 p-6 flex justify-center items-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-lg w-full space-y-4"
      >
        <div className="flex items-center gap-2 text-indigo-600 mb-2">
          <Building2 className="w-6 h-6" />
          <h2 className="text-xl font-bold text-gray-900">List Your Space</h2>
        </div>

        {error && (
          <p className="text-sm bg-red-50 text-red-600 p-2.5 rounded-lg">
            {error}
          </p>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Venue Title
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            placeholder="Grand Ballroom & Conference Center"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Description
          </label>
          <textarea
            required
            rows="3"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            placeholder="Describe amenities, lighting, acoustics..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Price / Day (₹)
            </label>
            <div className="relative">
              <IndianRupee className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
              <input
                type="number"
                required
                value={formData.pricePerDay}
                onChange={(e) =>
                  setFormData({ ...formData, pricePerDay: e.target.value })
                }
                className="w-full pl-8 pr-2.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                placeholder="15000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Max Capacity
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
              <input
                type="number"
                required
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: e.target.value })
                }
                className="w-full pl-8 pr-2.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                placeholder="250"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Longitude
            </label>
            <input
              type="text"
              required
              value={formData.longitude}
              onChange={(e) =>
                setFormData({ ...formData, longitude: e.target.value })
              }
              className="w-full p-2.5 border rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              Latitude
            </label>
            <input
              type="text"
              required
              value={formData.latitude}
              onChange={(e) =>
                setFormData({ ...formData, latitude: e.target.value })
              }
              className="w-full p-2.5 border rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Physical Address
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full pl-8 pr-2.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              placeholder="CIDCO, Chhatrapati Sambhajinagar"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition mt-2"
        >
          {loading ? "Publishing Venue..." : "Publish Venue"}
        </button>
      </form>
    </div>
  );
}
