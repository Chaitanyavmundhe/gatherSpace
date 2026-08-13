import { useState, useCallback, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { LocateFixed, MapPin } from "lucide-react";

// Leaflet's default marker icons reference image files in a way that breaks
// under bundlers like Vite. Rebuild the default icon from CDN URLs so pins
// actually render instead of showing broken image icons.
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Recenters the map imperatively whenever the position changes from
// outside the map (e.g. after a GPS lookup), since react-leaflet won't
// do this automatically on prop change alone.
function RecenterOnChange({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom() < 13 ? 13 : map.getZoom());
    }
  }, [position, map]);
  return null;
}

// Listens for map clicks and reports the clicked lat/lng back up.
function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Map-based location picker. Click anywhere on the map to drop a pin,
 * or use the "Use my location" button to center on GPS coordinates.
 *
 * Props:
 *  - latitude, longitude: current numeric coordinates (may be null initially)
 *  - onChange(lat, lng): called whenever the picked location changes
 */
export default function LocationPicker({ latitude, longitude, onChange }) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  const hasPosition =
    latitude != null &&
    longitude != null &&
    !isNaN(latitude) &&
    !isNaN(longitude);
  const position = hasPosition ? [Number(latitude), Number(longitude)] : null;

  // Fallback center (India, roughly central) used only when no position is set yet
  const defaultCenter = [22.5937, 78.9629];
  const defaultZoom = 5;

  const handlePick = useCallback(
    (lat, lng) => {
      onChange(lat, lng);
    },
    [onChange],
  );

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    setGeoError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Please allow access or click the map instead."
            : "Could not get your location. Please click the map to set it manually.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-gray-600 uppercase">
          Venue Location
        </label>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
        >
          <LocateFixed className="w-3.5 h-3.5" />
          {locating ? "Locating..." : "Use my current location"}
        </button>
      </div>

      {geoError && (
        <p className="text-xs text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg">
          {geoError}
        </p>
      )}

      <div
        className="rounded-lg overflow-hidden border border-gray-200"
        style={{ height: 300 }}
      >
        <MapContainer
          center={position || defaultCenter}
          zoom={position ? 13 : defaultZoom}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={handlePick} />
          {position && <RecenterOnChange position={position} />}
          {position && <Marker position={position} icon={defaultIcon} />}
        </MapContainer>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-gray-500">
        <MapPin className="w-3.5 h-3.5 shrink-0" />
        {position
          ? `Selected: ${position[0].toFixed(5)}, ${position[1].toFixed(5)}`
          : "Click on the map or use your current location to set the venue's position."}
      </p>
    </div>
  );
}
