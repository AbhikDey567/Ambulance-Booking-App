import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { handleSuccess, handleError } from "../utils";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./Mapview.css";

// Fix default Leaflet marker icons
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ---------- Custom Icons ----------
const driverIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3097/3097144.png",
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -28],
});

const customerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/9131/9131529.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -25],
});

const hospitalIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png",
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -28],
});

// ---------- Helpers ----------
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined
  )
    return null;
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
};

const getBookingDistances = (driverLocation, booking) => {
  if (!driverLocation || !booking?.userLocation) return {};
  const distToUser = calculateDistance(
    driverLocation.lat,
    driverLocation.lng,
    booking.userLocation.lat,
    booking.userLocation.lng
  );
  const distUserToHospital = booking.hospitalLocation
    ? calculateDistance(
        booking.userLocation.lat,
        booking.userLocation.lng,
        booking.hospitalLocation.lat,
        booking.hospitalLocation.lng
      )
    : null;
  return { distToUser, distUserToHospital };
};

// Normalize server response to array of bookings
const normalizeBookingsResponse = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.bookings)) return data.bookings;
  if (Array.isArray(data.records)) return data.records;
  if (Array.isArray(data.data)) return data.data;
  // single booking in booking / record / booking fields
  if (data.booking && typeof data.booking === "object") return [data.booking];
  if (data.record && typeof data.record === "object") return [data.record];
  if (data.records && typeof data.records === "object") return [data.records];
  // If API returns { success: true, bookings: [...] } handled above
  return [];
};

// Fit bounds helper (used in MapContainer via child component)
const FitBoundsToMarkers = ({ driverLocation, bookings, selectedBooking }) => {
  const map = useMap();
  useEffect(() => {
    if (!driverLocation) return;
    if (selectedBooking) {
      const bounds = [
        [driverLocation.lat, driverLocation.lng],
        [selectedBooking.userLocation.lat, selectedBooking.userLocation.lng],
      ];
      if (selectedBooking.hospitalLocation) {
        bounds.push([selectedBooking.hospitalLocation.lat, selectedBooking.hospitalLocation.lng]);
      }
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
      return;
    }
    if (bookings.length > 0) {
      const points = bookings
        .filter((b) => b.userLocation && b.userLocation.lat && b.userLocation.lng)
        .map((b) => [b.userLocation.lat, b.userLocation.lng]);
      points.push([driverLocation.lat, driverLocation.lng]);
      map.fitBounds(points, { padding: [50, 50], animate: true });
    }
  }, [driverLocation, bookings, selectedBooking, map]);
  return null;
};

// ---------- Component ----------
const MapView = () => {
  const [bookings, setBookings] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);
  const [arrivalTimes, setArrivalTimes] = useState({});
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const mapRef = useRef();
  const didRunRef = useRef(false);

  // --- get driver location (try geolocation -> fallback to saved driver location)
  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;

    const useSavedLocation = (msg) => {
      try {
        const driver = JSON.parse(localStorage.getItem("driver"));
        if (driver?.location) {
          setDriverLocation({ lat: driver.location.lat, lng: driver.location.lng });
          handleError(msg || "Using saved location.");
        } else {
          handleError("No saved driver location available.");
        }
      } catch (err) {
        console.error("Saved location parse error:", err);
        handleError("Could not read saved location.");
      }
    };

    const onSuccess = (pos) => {
      setDriverLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      handleSuccess("📍 Live location detected from device.");
    };
    const onError = (err) => {
      console.warn("Geolocation error:", err);
      useSavedLocation("Live location denied/unavailable — using saved location if available.");
    };

    if (!("geolocation" in navigator)) {
      useSavedLocation("Geolocation not supported — using saved location if available.");
      return;
    }
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  }, []);

  // --- fetch bookings from backend
  useEffect(() => {
    const fetchBookings = async () => {
      setLoadingBookings(true);
      const token = localStorage.getItem("driverToken");
      try {
        const res = await axios.get("http://localhost:8080/api/bookings/my-records", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const normalized = normalizeBookingsResponse(res.data);
        setBookings(normalized);
      } catch (err) {
        console.error("Failed to fetch bookings:", err, err?.response?.data);
        handleError(err.response?.data?.message || "Failed to fetch bookings");
        setBookings([]);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookings();
  }, []);

  // --- confirm booking (driver)
  const confirmBooking = async (bookingId) => {
    const token = localStorage.getItem("driverToken");
    const arrivalTime = arrivalTimes[bookingId];
    if (!arrivalTime || arrivalTime.toString().trim() === "") return handleError("Please enter an arrival time first.");

    try {
      const res = await axios.put(
        `http://localhost:8080/api/bookings/confirm/${bookingId}`,
        { arrivalTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      handleSuccess("Booking confirmed!");
      // server may return { booking } or { record } or { success, booking }
      const updatedBookings = normalizeBookingsResponse(res.data);
      if (updatedBookings.length > 0) {
        const updated = updatedBookings[0];
        setBookings((prev) => prev.map((b) => (b._id === bookingId ? updated : b)));
      } else if (res.data.booking) {
        setBookings((prev) => prev.map((b) => (b._id === bookingId ? res.data.booking : b)));
      } else {
        // fallback: set status locally
        setBookings((prev) => prev.map((b) => (b._id === bookingId ? { ...b, status: "confirmed", arrivalTime } : b)));
      }
    } catch (err) {
      console.error("Confirm error:", err);
      handleError(err.response?.data?.message || "Failed to confirm booking");
    }
  };

  // --- cancel booking
  const cancelBooking = async (bookingId) => {
    const token = localStorage.getItem("driverToken");
    try {
      const res = await axios.put(
        `http://localhost:8080/api/bookings/cancel/${bookingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      handleSuccess("Booking cancelled!");
      const normalized = normalizeBookingsResponse(res.data);
      if (normalized.length > 0) {
        const updated = normalized[0];
        setBookings((prev) => prev.map((b) => (b._id === bookingId ? updated : b)));
      } else if (res.data.booking) {
        setBookings((prev) => prev.map((b) => (b._id === bookingId ? res.data.booking : b)));
      } else {
        setBookings((prev) => prev.map((b) => (b._id === bookingId ? { ...b, status: "cancelled" } : b)));
      }
    } catch (err) {
      console.error("Cancel error:", err);
      handleError(err.response?.data?.message || "Failed to cancel booking");
    }
  };

  // safeBookings for rendering
  const safeBookings = Array.isArray(bookings) ? bookings : [];

  return (
    <div className="mapview-container">
      {/* Bookings list */}
      <div className="bookings-card">
        <h2>My Bookings</h2>
        {loadingBookings && <p className="empty-text">Loading bookings...</p>}
        {!loadingBookings && safeBookings.length === 0 && <p className="empty-text">No bookings yet.</p>}

        {safeBookings.map((b) => {
          const { distToUser, distUserToHospital } = getBookingDistances(driverLocation, b);
          const isSelected = selectedBooking && selectedBooking._id === b._id;

          return (
            <div
              key={b._id}
              className={`booking-item ${b.status || ""}`}
              onClick={() => {
                setSelectedBooking(b);
                if (mapRef.current && driverLocation) {
                  const bounds = [
                    [driverLocation.lat, driverLocation.lng],
                    [b.userLocation.lat, b.userLocation.lng],
                  ];
                  if (b.hospitalLocation) bounds.push([b.hospitalLocation.lat, b.hospitalLocation.lng]);
                  try {
                    mapRef.current.fitBounds(bounds, { padding: [50, 50], animate: true });
                  } catch (err) {
                    // ignore fitBounds errors
                  }
                }
              }}
            >
              <h3>{b.userId?.name} ({b.userId?.phone || "N/A"})</h3>
              <p>Status: <b>{b.status || "N/A"}</b></p>

              <p>📏 Distance (You → User): {distToUser ?? "N/A"} km</p>
              {b.hospitalLocation && <p>📏 Distance (User → Hospital): {distUserToHospital ?? "N/A"} km</p>}

              {/* Pending flow */}
              {b.status === "pending" && isSelected && (
                <>
                  {!editingBooking || editingBooking !== b._id ? (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); setEditingBooking(b._id); }}>
                        Confirm
                      </button>
                      <button
                        style={{ marginLeft: 8, background: "red", color: "white" }}
                        onClick={(e) => { e.stopPropagation(); cancelBooking(b._id); }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Arrival time (e.g. 30 mins)"
                        value={arrivalTimes[b._id] || ""}
                        onChange={(e) => setArrivalTimes((s) => ({ ...s, [b._id]: e.target.value }))}
                        style={{ marginRight: 8 }}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmBooking(b._id);
                          setEditingBooking(null);
                          setSelectedBooking(null);
                        }}
                      >
                        Submit
                      </button>
                    </>
                  )}
                </>
              )}

              {b.status === "confirmed" && b.arrivalTime && <p>✅ Confirmed — Arrival: {b.arrivalTime}</p>}
              {b.status === "cancelled" && <p>❌ Cancelled</p>}
            </div>
          );
        })}
      </div>

      {/* Map */}
      <div className="map-card">
        {driverLocation && (
          <MapContainer
            center={[driverLocation.lat, driverLocation.lng]}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
            whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            {/* Driver marker */}
            <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
              <Popup>You (Driver)</Popup>
            </Marker>

            {/* Markers for bookings */}
            {safeBookings.map((b) => {
              const isSelected = selectedBooking && selectedBooking._id === b._id;
              const { distToUser, distUserToHospital } = getBookingDistances(driverLocation, b);

              return (
                <React.Fragment key={b._id}>
                  <Marker
                    position={[b.userLocation.lat, b.userLocation.lng]}
                    icon={customerIcon}
                  >
                    <Popup>
                      <div>
                        <strong>{b.userId?.name || "User"}</strong>
                        {distToUser && <div>📏 You → User: {distToUser} km</div>}
                      </div>
                    </Popup>
                  </Marker>

                  {b.hospitalLocation && (
                    <Marker
                      position={[b.hospitalLocation.lat, b.hospitalLocation.lng]}
                      icon={hospitalIcon}
                    >
                      <Popup>
                        <div>
                          🏥 {b.hospitalLocation.address || b.hospitalLocation.name}
                          {distUserToHospital && <div>📏 User → Hospital: {distUserToHospital} km</div>}
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* draw lines only for selected booking for clarity */}
                  {isSelected && (
                    <Polyline positions={[
                      [driverLocation.lat, driverLocation.lng],
                      [b.userLocation.lat, b.userLocation.lng],
                    ]} color="green" />
                  )}

                  {isSelected && b.hospitalLocation && (
                    <Polyline positions={[
                      [b.userLocation.lat, b.userLocation.lng],
                      [b.hospitalLocation.lat, b.hospitalLocation.lng],
                    ]} color="red" />
                  )}
                </React.Fragment>
              );
            })}

            <FitBoundsToMarkers driverLocation={driverLocation} bookings={safeBookings} selectedBooking={selectedBooking} />
          </MapContainer>
        )}

        {!driverLocation && <p style={{ padding: 12 }}>Waiting for driver location...</p>}
      </div>
    </div>
  );
};

export default MapView;
