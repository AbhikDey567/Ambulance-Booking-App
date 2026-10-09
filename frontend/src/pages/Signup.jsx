import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Link } from "react-router-dom";
import { handleSuccess, handleError } from "../utils";
import logo from "../assets/logo.png";

// Fix default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const Signup = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    experience: "",
    email: "",
    password: "",
    typeOfAmbulance: "", // <-- NEW field
    location: { lat: 20.5937, lng: 78.9629 },
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Map marker that updates on click
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setForm((prev) => ({
          ...prev,
          location: { lat: e.latlng.lat, lng: e.latlng.lng },
        }));
      },
    });
    return <Marker position={[form.location.lat, form.location.lng]} />;
  };

  // Force map to resize properly in flex layouts
  const ResizeMap = () => {
    const map = useMap();
    useEffect(() => {
      setTimeout(() => map.invalidateSize(), 200);
    }, [map]);
    return null;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit form
  // Submit form (replace your existing handleSubmit with this)
const handleSubmit = async (e) => {
  e.preventDefault();

  // Validation
  const { name, phone, experience, email, password, location, typeOfAmbulance } = form;

  // Basic client-side checks
  if (!name || !phone || !experience || !email || !password) {
    return handleError("All fields are required");
  }

  // convert experience to number for validation
  const expNum = Number(experience);
  if (Number.isNaN(expNum) || expNum < 0) {
    return handleError("Experience must be a non-negative number");
  }

  // ensure typeOfAmbulance exists (if you added the select)
  if (typeof typeOfAmbulance === "undefined" || typeOfAmbulance === "") {
    return handleError("Please select the ambulance type");
  }

  // Ensure location is selected
  const defaultLocation = { lat: 20.5937, lng: 78.9629 };
  if (location.lat === defaultLocation.lat && location.lng === defaultLocation.lng) {
    return handleError("Please select your location on the map");
  }

  // Build payload with strict types
  const payload = {
    name: String(name).trim(),
    phone: String(phone).trim(),
    experience: expNum,
    email: String(email).trim(),
    password: String(password),
    // include typeOfAmbulance only if present in your form
    ...(typeOfAmbulance !== undefined && { typeOfAmbulance: String(typeOfAmbulance) }),
    location: {
      lat: Number(location.lat),
      lng: Number(location.lng),
    },
  };

  try {
    setLoading(true);

    // Log payload so you can inspect Request Payload in console BEFORE network tab
    console.log("Driver signup payload:", payload);

    const resp = await axios.post("http://localhost:8080/api/auth/driver/signup", payload, {
      headers: { "Content-Type": "application/json" },
    });

    setLoading(false);
    console.log("Server response:", resp.data);
    handleSuccess("Driver registered successfully!");

    // reset
    setForm({
      name: "",
      phone: "",
      experience: "",
      email: "",
      password: "",
      typeOfAmbulance: "", // if you have it
      location: { lat: 20.5937, lng: 78.9629 },
    });

    setTimeout(() => navigate("/login"), 2000);
  } catch (err) {
    setLoading(false);
    // Very important: show full server response (body) in console
    console.error("Signup error (axios):", err);
    console.error("Server response body:", err.response?.data);
    // Use the server's message if present
    const errorMsg = err.response?.data?.message || err.message || "Error registering Driver";
    handleError(errorMsg);
  }
};

  return (
    <div className="auth-container">
      {/* Form Section */}
      <div className="auth-box">
        <img src={logo} alt="Logo" className="auth-logo" />
        <h1>Register as Driver</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="text"
              name="phone"
              placeholder="Enter your phone number"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Experience (in years)</label>
            <input
              type="text"
              name="experience"
              placeholder="Enter your work experience"
              value={form.experience}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* NEW FIELD: Type of Ambulance */}
          <div className="form-group">
            <label>Type of Ambulance</label>
            <select
              name="typeOfAmbulance"
              value={form.typeOfAmbulance}
              onChange={handleChange}
              required
            >
              <option value="">Select ambulance type</option>
              <option value="BLS">BLS (Basic Life Support)</option>
              <option value="ALS">ALS (Advanced Life Support)</option>
              <option value="Patient Transport">Patient Transport</option>
              <option value="Mortuary">Mortuary</option>
              <option value="Neonatal">Neonatal Ambulance</option>
            </select>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <span className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </span>
      </div>

      {/* Map Section */}
      <div className="map-container">
        <h2 style={{ textAlign: "center", margin: "1rem 0" }}>Select Your Location</h2>
        <MapContainer
          center={[form.location.lat, form.location.lng]}
          zoom={5}
          style={{ height: "calc(100% - 60px)", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <ResizeMap />
          <LocationMarker />
        </MapContainer>
      </div>
    </div>
  );
};

export default Signup;
