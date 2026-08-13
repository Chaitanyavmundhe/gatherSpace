import { useState, useEffect } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import { Building2, IndianRupee, Users, MapPin } from "lucide-react";
import LocationPicker from "./LocationPicker";

/**
 * Shared form for creating or editing a venue.
 * Pass `venueId` + `initialData` to edit an existing venue; omit both to create a new one.
 */
export default function VenueForm({ venueId = null, initialData = null }) {
  const isEditMode = Boolean(venueId);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    pricePerDay: "",
    capacity: "",
    address: "",
  });
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Pre-fill the form when editing an existing venue
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        pricePerDay: initialData.pricePerDay ?? "",
        capacity: initialData.capacity ?? "",
        address: initialData.location?.formattedAddress || "",
      });
      const coords = initialData.location?.coordinates;
      if (coords && coords.length === 2) {
        setLongitude(coords[0]);
        setLatitude(coords[1]);
      }
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      latitude == null ||
      longitude == null ||
      isNaN(latitude) ||
      isNaN(longitude)
    ) {
      setError(
        "Please set the venue location by clicking the map or using your current location.",
      );
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        pricePerDay: Number(formData.pricePerDay),
        capacity: Number(formData.capacity),
        location: {
          type: "Point",
          coordinates: [longitude, latitude],
          address: formData.address,
        },
      };

      if (isEditMode) {
        await API.put(`/venues/${venueId}`, payload);
      } else {
        await API.post("/venues", payload);
      }

      navigate("/my-venues");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} venue`,
      );
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
          <h2 className="text-xl font-bold text-gray-900">
            {isEditMode ? "Edit Your Space" : "List Your Space"}
          </h2>
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
                min="0"
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
                min="1"
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

        <LocationPicker
          latitude={latitude}
          longitude={longitude}
          onChange={(lat, lng) => {
            setLatitude(lat);
            setLongitude(lng);
          }}
        />

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Physical Address{" "}
            <span className="normal-case font-normal text-gray-400">
              (optional label, e.g. for display)
            </span>
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
            <input
              type="text"
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
          {loading
            ? isEditMode
              ? "Saving Changes..."
              : "Publishing Venue..."
            : isEditMode
              ? "Save Changes"
              : "Publish Venue"}
        </button>
      </form>
    </div>
  );
}
