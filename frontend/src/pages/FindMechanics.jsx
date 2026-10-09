import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { handleSuccess, handleError } from "../utils";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {jwtDecode} from "jwt-decode"; // fixed import
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "./FindMechanics.css";

// Fix default marker issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ---------- Custom Icons ----------
const userIcon = new L.Icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149060.png", iconSize: [35,35], iconAnchor: [17,35], popupAnchor: [0,-35] });
const driverIcon = new L.Icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/1484/1484842.png", iconSize: [30,30], iconAnchor: [15,30], popupAnchor: [0,-30] });
const driverSelectedIcon = new L.Icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", iconSize: [38,38], iconAnchor: [19,38], popupAnchor: [0,-35] });
const driverUnavailableIcon = new L.Icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/565/565547.png", iconSize: [30,30], iconAnchor: [15,30], popupAnchor: [0,-30] });
const hospitalIcon = new L.Icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png", iconSize: [30,30], iconAnchor: [15,30], popupAnchor: [0,-30] });

// ---------- Map Helpers ----------
function MapClickHandler({ onClick }) {
  useMapEvents({ click(e) { onClick(e.latlng); } });
  return null;
}
function FlyToTempLocation({ tempLocation }) {
  const map = useMap();
  useEffect(() => { if (tempLocation) map.flyTo([tempLocation.lat, tempLocation.lng], 15, { animate: true, duration: 1.2 }); }, [tempLocation, map]);
  return null;
}
function AutoZoomAll({ userLocation, drivers, hospitals }) {
  const map = useMap();
  useEffect(() => {
    if (userLocation && (drivers.length > 0 || hospitals.length > 0)) {
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lng],
        ...drivers.map((m) => [m.location.lat, m.location.lng]),
        ...hospitals.map((h) => [h.lat, h.lng]),
      ]);
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [userLocation, drivers, hospitals, map]);
  return null;
}
function FlyToUserAndDriver({ userLocation, driver }) {
  const map = useMap();
  useEffect(() => { if (userLocation && driver) { const bounds = L.latLngBounds([[userLocation.lat, userLocation.lng],[driver.location.lat, driver.location.lng]]); map.fitBounds(bounds, { padding: [80, 80] }); } }, [userLocation, driver, map]);
  return null;
}
function FlyToUserDriverHospital({ userLocation, driver, hospital }) {
  const map = useMap();
  useEffect(() => { if (userLocation && driver && hospital) { const bounds = L.latLngBounds([[userLocation.lat, userLocation.lng],[driver.location.lat, driver.location.lng],[hospital.lat, hospital.lng]]); map.fitBounds(bounds, { padding: [80, 80] }); } }, [userLocation, driver, hospital, map]);
  return null;
}

// ---------- Main ----------
const FindMechanics = () => {
  const [drivers, setDrivers] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [confirmedLocation, setConfirmedLocation] = useState(null);
  const [tempLocation, setTempLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [hospitalDistance, setHospitalDistance] = useState(null);
  const [radius, setRadius] = useState(10);

  // filters + booking state
  const [selectedAmbulanceType, setSelectedAmbulanceType] = useState("All");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  // success modal
  const navigate = useNavigate();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const didRunRef = useRef(false);

  const AMB_TYPES = ["All", "BLS", "ALS", "Patient Transport", "Mortuary", "Neonatal"];

  // geolocation once
  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setConfirmedLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        handleSuccess("📍 Live location detected from device.");
      }, (err) => {
        console.warn("Geolocation denied or failed:", err.message);
        handleError("⚠️ Live location denied, please confirm manually.");
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    } else {
      handleError("⚠️ Geolocation not supported, please confirm manually.");
    }
  }, []);

  // SearchBar component (same as before)
  function SearchBar({ onSelect, userLocation }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
      if (!query.trim()) { setResults([]); return; }
      const delayDebounce = setTimeout(async () => {
        try {
          let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=7`;
          if (userLocation) {
            const { lat, lng } = userLocation;
            const bbox = `${lng - 0.2},${lat - 0.2},${lng + 0.2},${lat + 0.2}`;
            url += `&viewbox=${bbox}&bounded=1`;
          }
          let res = await fetch(url);
          let data = await res.json();

          if ((!data || data.length === 0) && userLocation) {
            const { lat, lng } = userLocation;
            const overpassQuery = `
              [out:json][timeout:25];
              (
                node["name"~"${query}",i](around:5000, ${lat}, ${lng});
                way["name"~"${query}",i](around:5000, ${lat}, ${lng});
                relation["name"~"${query}",i](around:5000, ${lat}, ${lng});
              );
              out center;
            `;
            const overpassRes = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: overpassQuery });
            const overpassData = await overpassRes.json();
            data = overpassData.elements.map((el) => ({
              display_name: el.tags?.name || "Unnamed Place",
              lat: el.lat || el.center?.lat,
              lon: el.lon || el.center?.lon,
              address: el.tags || {},
            }));
          }
          setResults(data);
          setShowResults(true);
        } catch (err) {
          console.error("Search failed:", err);
        }
      }, 400);
      return () => clearTimeout(delayDebounce);
    }, [query, userLocation]);

    const handleSelect = (place) => {
      const lat = place.lat || place.center?.lat;
      const lon = place.lon || place.center?.lon;
      if (!lat || !lon) return;
      const loc = { lat: parseFloat(lat), lng: parseFloat(lon), display_name: place.display_name, details: place.address || {} };
      onSelect(loc);
      setQuery(place.display_name);
      setShowResults(false);
    };

    const handleClear = () => { setQuery(""); setResults([]); setShowResults(false); };

    return (
      <div className="search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search by landmark, road, city, PIN..." value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setShowResults(true)} />
          {query && <button className="clear-btn" onClick={handleClear}>×</button>}
        </div>

        {showResults && results.length > 0 && (
          <ul className="search-results">
            {results.map((place, idx) => {
              const lat = place.lat || place.center?.lat;
              const lon = place.lon || place.center?.lon;
              const isValid = lat && lon;
              return (
                <li key={idx} onClick={() => isValid && handleSelect(place)} className={isValid ? "" : "disabled-result"}>
                  {place.display_name}
                  {!isValid && <span className="warning-text"> ⚠️ No precise point found</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  // Fetch drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (!token) return;
        const decoded = jwtDecode(token);
        const role = decoded?.role;
        const res = await fetch("http://localhost:8080/api/auth/drivers/all", {
          method: "GET",
          headers: { "Content-Type": "application/json", "x-user-role": role },
        });
        const data = await res.json();
        if (data.success) setDrivers(data.drivers);
      } catch (err) {
        console.error("Failed to fetch drivers:", err);
      }
    };
    fetchDrivers();
  }, []);

  // Fetch hospitals (same)
  useEffect(() => {
    if (!confirmedLocation) return;
    const fetchHospitals = async () => {
      try {
        const query = `
          [out:json];
          (
            node["amenity"="hospital"](around:${radius * 1000}, ${confirmedLocation.lat}, ${confirmedLocation.lng});
            way["amenity"="hospital"](around:${radius * 1000}, ${confirmedLocation.lat}, ${confirmedLocation.lng});
            relation["amenity"="hospital"](around:${radius * 1000}, ${confirmedLocation.lat}, ${confirmedLocation.lng});
          );
          out center;
        `;
        const res = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: query });
        const data = await res.json();
        const hospitals = data.elements.map((el) => ({ name: el.tags?.name || "Unnamed Hospital", lat: el.lat || el.center?.lat, lng: el.lon || el.center?.lon })).filter((h) => h.lat && h.lng);
        setHospitals(hospitals);
      } catch (err) {
        console.error("Failed to fetch hospitals from OSM:", err);
      }
    };
    fetchHospitals();
  }, [confirmedLocation, radius]);

  // Distance calc
  const calculateDistance = (loc1, loc2) => {
    if (!loc1 || !loc2) return null;
    const R = 6371;
    const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const dLon = ((loc2.lng - loc1.lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((loc1.lat * Math.PI) / 180) * Math.cos((loc2.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
  };

  const handleSelectDriver = (driver) => {
    setSelectedDriver(driver);
    setDistance(confirmedLocation && driver.location ? calculateDistance(confirmedLocation, driver.location) : null);
  };
  const handleSelectHospital = (hospital) => {
    setSelectedHospital(hospital);
    setHospitalDistance(confirmedLocation ? calculateDistance(confirmedLocation, hospital) : null);
  };
  const handleConfirmLocation = () => {
    if (tempLocation) {
      setConfirmedLocation(tempLocation);
      setSelectedDriver(null);
      setSelectedHospital(null);
      setDistance(null);
      setHospitalDistance(null);
    }
  };

  // BOOK DRIVER - note: removed automatic timeout redirect; navigate only on OK
  const handleBookDriver = async () => {
    if (isBooking) return;
    if (!selectedDriver) return handleError("Please select a driver first.");
    if (!confirmedLocation) return handleError("Please confirm your pickup location first.");
    const token = localStorage.getItem("userToken");
    if (!token) return handleError("You must be logged in to book a driver.");

    setIsBooking(true);

    const ambulanceTypeFromDriver = selectedDriver.typeOfAmbulance || selectedDriver.ambulanceType || null;
    const ambulanceType = ambulanceTypeFromDriver || (selectedAmbulanceType !== "All" ? selectedAmbulanceType : null);
    if (!ambulanceType) { setIsBooking(false); return handleError("No ambulance type available for this driver."); }

    // ETA calc
    let arrivalTime = null;
    if (selectedDriver.location && confirmedLocation) {
      const distStr = calculateDistance(confirmedLocation, selectedDriver.location);
      const distKm = distStr ? Number(distStr) : null;
      if (!Number.isNaN(distKm) && distKm !== null) {
        const avgSpeed = 40;
        const etaMinutes = Math.max(1, Math.round((distKm / avgSpeed) * 60));
        arrivalTime = `${etaMinutes} min`;
      }
    }

    const body = {
      driverId: selectedDriver._id,
      userLocation: {
        address: `Lat: ${confirmedLocation.lat.toFixed(5)}, Lng: ${confirmedLocation.lng.toFixed(5)}`,
        lat: confirmedLocation.lat, lng: confirmedLocation.lng,
      },
      hospitalLocation: selectedHospital ? {
        name: selectedHospital.name,
        address: `Lat: ${selectedHospital.lat.toFixed(5)}, Lng: ${selectedHospital.lng.toFixed(5)}`,
        lat: selectedHospital.lat, lng: selectedHospital.lng,
      } : null,
      ambulanceType,
      arrivalTime,
    };

    try {
      const res = await fetch("http://localhost:8080/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setIsBooking(false);

      if (!res.ok) {
        return handleError(data.message || "Failed to create record");
      }

      setSuccessMessage("Record created successfully!");
      setShowSuccessModal(true);
      // NO automatic navigate - user must click OK
    } catch (err) {
      setIsBooking(false);
      console.error("Record creation error:", err);
      handleError("Something went wrong while creating the record.");
    }
  };

  // FILTER drivers
  const filteredDrivers = confirmedLocation && drivers.length > 0
    ? drivers
        .filter((m) => m.location?.lat)
        .filter((m) => Number(calculateDistance(confirmedLocation, m.location)) <= radius)
        .filter((m) => { if (selectedAmbulanceType === "All") return true; const dType = m.typeOfAmbulance || m.ambulanceType || ""; return dType === selectedAmbulanceType; })
        .filter((m) => (showOnlyAvailable ? m.available === true : true))
    : [];

  const filteredHospitals = confirmedLocation && hospitals.length > 0
    ? hospitals.filter((h) => h.lat && calculateDistance(confirmedLocation, h) <= radius)
    : [];

  return (
    <div className="find-drivers-container">
      {/* Modern Success Alert (top, accessible) */}
{showSuccessModal && (
  <div
    role="status"
    aria-live="polite"
    className="modern-success-alert"
  >
    <div className="msa-left">
      {/* friendly check SVG */}
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="12" fill="url(#g)"/>
        <path d="M7.5 12.5l2.2 2.2 6.8-6.8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#39D353"/>
            <stop offset="1" stopColor="#0BB34A"/>
          </linearGradient>
        </defs>
      </svg>
    </div>

    <div className="msa-body">
      <div className="msa-title">Success</div>
      <div className="msa-message">{successMessage}</div>
    </div>

    <div className="msa-actions">
      <button
        className="msa-ok"
        onClick={() => {
          setShowSuccessModal(false);
          navigate("/user-dashboard");
        }}
      >
        OK
      </button>

      <button
        className="msa-close"
        aria-label="Dismiss"
        onClick={() => {
          // just close, do not navigate
          setShowSuccessModal(false);
        }}
      >
        ✕
      </button>
    </div>
  </div>
)}


      <>
        {/* Map & UI (unchanged layout) */}
        <div className="map-card">
          <SearchBar onSelect={(loc) => { setTempLocation({ lat: loc.lat, lng: loc.lng }); setConfirmedLocation(null); }} userLocation={confirmedLocation} />
          <MapContainer center={[20.5937, 78.9629]} zoom={5}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            <MapClickHandler onClick={(latlng) => setTempLocation(latlng)} />
            {tempLocation && !confirmedLocation && <FlyToTempLocation tempLocation={tempLocation} />}
            {tempLocation && !confirmedLocation && <Marker position={tempLocation}><Popup>Selected Location</Popup></Marker>}
            {confirmedLocation && <>
              <Marker position={[confirmedLocation.lat, confirmedLocation.lng]} icon={userIcon}><Popup>Your Location</Popup></Marker>
              <Circle center={[confirmedLocation.lat, confirmedLocation.lng]} radius={radius * 1000} pathOptions={{ color: "blue", fillOpacity: 0.1 }} />
            </>}
            {filteredDrivers.map((m) => (
              <Marker key={m._id} position={[m.location.lat, m.location.lng]} icon={selectedDriver?._id === m._id ? driverSelectedIcon : m.available ? driverIcon : driverUnavailableIcon} eventHandlers={{ click: () => handleSelectDriver(m) }}>
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    <strong>{m.name}</strong>
                    <div style={{ fontSize: 13, marginTop: 6 }}>
                      {m.typeOfAmbulance || m.ambulanceType ? <div>Amb: {m.typeOfAmbulance || m.ambulanceType}</div> : null}
                      <div>Exp: {m.experience ?? "N/A"} yrs</div>
                      <div>Phone: {m.phone}</div>
                      <div>Status: <span style={{ color: m.available ? "green" : "crimson", fontWeight: 600 }}>{m.available ? "Available" : "Unavailable"}</span></div>
                      {confirmedLocation && m.location && <div>Distance: {calculateDistance(confirmedLocation, m.location)} km</div>}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
            {filteredHospitals.map((h, idx) => (
              <Marker key={idx} position={[h.lat, h.lng]} icon={hospitalIcon} eventHandlers={{ click: () => handleSelectHospital(h) }}>
                <Popup>{h.name}{confirmedLocation && <p>Distance: {calculateDistance(confirmedLocation, h)} km</p>}</Popup>
              </Marker>
            ))}
            {confirmedLocation && selectedDriver && <Polyline positions={[[selectedDriver.location.lat, selectedDriver.location.lng],[confirmedLocation.lat, confirmedLocation.lng]]} color="green" />}
            {confirmedLocation && selectedDriver && selectedHospital && <Polyline positions={[[confirmedLocation.lat, confirmedLocation.lng],[selectedHospital.lat, selectedHospital.lng]]} color="red" />}
            {confirmedLocation && !selectedDriver && <AutoZoomAll userLocation={confirmedLocation} drivers={filteredDrivers} hospitals={filteredHospitals} />}
            {confirmedLocation && selectedDriver && !selectedHospital && <FlyToUserAndDriver userLocation={confirmedLocation} driver={selectedDriver} />}
            {confirmedLocation && selectedDriver && selectedHospital && <FlyToUserDriverHospital userLocation={confirmedLocation} driver={selectedDriver} hospital={selectedHospital} />}
          </MapContainer>

          {tempLocation && !confirmedLocation && (
            <button className="confirm-btn" onClick={handleConfirmLocation} style={{ position: "absolute", bottom: "20px", left: "20px", zIndex: 9999, boxShadow: "0 4px 12px rgba(0,0,0,0.2)", borderRadius: "50px" }}>
              Confirm My Location
            </button>
          )}
        </div>

        {/* Lists & Filters */}
        <div className="list-card">
          {confirmedLocation && (
            <div className="radius-selector">
              <label htmlFor="radius">Search Radius: {radius} km</label>
              <input id="radius" type="range" min="1" max="10" step="1" value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="radius-slider" />
            </div>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "8px 0", flexWrap: "wrap" }}>
            {AMB_TYPES.map((t) => (
              <button key={t} onClick={() => { setSelectedAmbulanceType(t); setSelectedDriver(null); }} style={{ padding: "8px 12px", borderRadius: 20, color: selectedAmbulanceType === t ? "#0b74de" : "#333", border: selectedAmbulanceType === t ? "2px solid #0b74de" : "1px solid #ccc", background: selectedAmbulanceType === t ? "#e8f3ff" : "#fff", cursor: "pointer" }}>{t}</button>
            ))}

            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ fontSize: 14 }}>Only available</label>
              <button onClick={() => setShowOnlyAvailable((s) => !s)} style={{ padding: "6px 10px", borderRadius: 12, color: showOnlyAvailable ? "#0b74de" : "#333", border: "1px solid #ccc", background: showOnlyAvailable ? "#e6ffed" : "#fff", cursor: "pointer" }}>{showOnlyAvailable ? "Yes" : "No"}</button>
            </div>
          </div>

          <h3>Nearby Drivers</h3>
          <div className="driver-list">
            {filteredDrivers.length > 0 ? filteredDrivers.map((m) => (
              <div key={m._id} className={`driver-item ${selectedDriver?._id === m._id ? "selected" : ""}`} onClick={() => handleSelectDriver(m)} style={{ opacity: m.available ? 1 : 0.6, cursor: "pointer" }}>
                <div className="driver-name">{m.name}</div>
                <div style={{ fontSize: 13, color: "#444" }}>{(m.typeOfAmbulance || m.ambulanceType) && <span>{m.typeOfAmbulance || m.ambulanceType} • </span>}Exp: {m.experience ?? "N/A"} yrs</div>
                {confirmedLocation && selectedDriver?._id === m._id && <div className="driver-distance">📍 {distance} km away</div>}
                <div style={{ fontSize: 12, fontWeight: 700, color: m.available ? "green" : "crimson", marginTop: 6 }}>{m.available ? "Available" : "Unavailable"}</div>
              </div>
            )) : <p>No drivers found nearby.</p>}
          </div>

          <h3>Nearby Hospitals</h3>
          <div className="driver-list">
            {filteredHospitals.length > 0 ? filteredHospitals.map((h, idx) => (
              <div key={idx} className={`driver-item ${selectedHospital?.lat === h.lat && selectedHospital?.lng === h.lng ? "selected" : ""}`} onClick={() => handleSelectHospital(h)}>
                <div className="driver-name">{h.name}</div>
                {confirmedLocation && selectedHospital?.lat === h.lat && selectedHospital?.lng === h.lng && <div className="driver-distance">📍 {hospitalDistance} km away</div>}
              </div>
            )) : <p>No hospitals found nearby.</p>}
          </div>

          {selectedDriver && (
            <button className="book-btn" onClick={handleBookDriver} disabled={isBooking} style={{ opacity: isBooking ? 0.7 : 1, cursor: isBooking ? "not-allowed" : "pointer", position: "relative" }}>
              {isBooking ? <><span className="spinner" aria-hidden></span> Booking...</> : "Book This Driver"}
            </button>
          )}
        </div>
      </>
    </div>
  );
};

export default FindMechanics;
