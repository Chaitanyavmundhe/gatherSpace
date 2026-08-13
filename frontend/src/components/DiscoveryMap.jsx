import { useState, useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { LocateFixed, MapPin, Users, IndianRupee } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Standard Leaflet marker icon fix for Vite build
const centerIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const venueIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function RecenterOnChange({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom() < 11 ? 11 : map.getZoom());
    }
  }, [center, map]);
  return null;
}

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function DiscoveryMap({
  latitude,
  longitude,
  distance,
  venues = [],
  onLocationChange,
}) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");
  const navigate = useNavigate();

  const currentCenter = [Number(latitude) || 19.8762, Number(longitude) || 75.3433];
  const radiusInMeters = (Number(distance) || 50) * 1000;

  const handlePick = useCallback(
    (lat, lng) => {
      onLocationChange(lat, lng);
    },
    [onLocationChange]
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
        onLocationChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied."
            : "Could not fetch current location."
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-semibold text-gray-800">
            Interactive Search Map
          </span>
          <span className="text-xs text-gray-400">
            (Click map to move search center)
          </span>
        </div>

        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
        >
          <LocateFixed className="w-3.5 h-3.5" />
          {locating ? "Locating..." : "Use my location"}
        </button>
      </div>

      {geoError && (
        <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">
          {geoError}
        </p>
      )}

      <div className="h-80 w-full rounded-lg overflow-hidden border border-gray-200 relative z-0">
        <MapContainer
          center={currentCenter}
          zoom={10}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={handlePick} />
          <RecenterOnChange center={currentCenter} />

          {/* Search Center Pin */}
          <Marker position={currentCenter} icon={centerIcon}>
            <Popup>
              <div className="text-xs font-semibold">
                📍 Search Center <br />
                <span className="text-gray-500 font-mono">
                  {currentCenter[0].toFixed(4)}, {currentCenter[1].toFixed(4)}
                </span>
              </div>
            </Popup>
          </Marker>

          {/* Radius circle around search center */}
          <Circle
            center={currentCenter}
            radius={radiusInMeters}
            pathOptions={{
              color: "#4f46e5",
              fillColor: "#6366f1",
              fillOpacity: 0.15,
            }}
          />

          {/* Venue Markers */}
          {venues.map((venue) => {
            const coords = venue.location?.coordinates;
            if (!coords || coords.length < 2) return null;
            const venueLat = coords[1];
            const venueLng = coords[0];

            return (
              <Marker
                key={venue._id}
                position={[venueLat, venueLng]}
                icon={venueIcon}
              >
                <Popup>
                  <div className="p-1 space-y-2 max-w-[200px]">
                    <h4 className="font-bold text-sm text-gray-900 leading-tight">
                      {venue.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {venue.description}
                    </p>
                    <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                      <span className="flex items-center gap-0.5">
                        <Users className="w-3 h-3 text-indigo-500" />
                        {venue.capacity}
                      </span>
                      <span className="flex items-center gap-0.5 text-emerald-600 font-bold">
                        <IndianRupee className="w-3 h-3" />
                        {venue.pricePerDay}/d
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 pt-1">
                      <button
                        onClick={() => navigate(`/negotiate/room_${venue._id}`)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold py-1 rounded text-center"
                      >
                        Negotiate
                      </button>
                      <button
                        onClick={() => navigate(`/book/${venue._id}`)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold py-1 rounded text-center"
                      >
                        Reserve
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          Selected Center:{" "}
          <strong className="font-mono text-gray-800">
            Lat {currentCenter[0].toFixed(4)}, Lng {currentCenter[1].toFixed(4)}
          </strong>
        </span>
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>{" "}
            Search Center
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>{" "}
            Venues ({venues.length})
          </span>
        </span>
      </div>
    </div>
  );
}
