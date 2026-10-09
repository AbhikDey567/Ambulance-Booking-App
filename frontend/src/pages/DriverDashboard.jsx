import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { handleSuccess, handleError } from "../utils";
import useHandleLogout from "../hooks/useHandleLogout";
import { useNavigate } from "react-router-dom";
import "./DriverDashboard.css";

const DriverDashboard = () => {
  const [records, setRecords] = useState([]); // always keep array shape
  const [loading, setLoading] = useState(false);
  const [driverId, setDriverId] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const navigate = useNavigate();
  const Logout = useHandleLogout("driver");

  // Decode driver token + load local profile
  useEffect(() => {
    const token = localStorage.getItem("driverToken");
    const stored = localStorage.getItem("driver");

    if (!token) return;

    if (stored) {
      try {
        setDriverInfo(JSON.parse(stored));
      } catch (e) {
        setDriverInfo(null);
      }
    }

    try {
      const decoded = jwtDecode(token);
      const id = decoded?._id || decoded?.id;
      if (id) setDriverId(id);
      else handleError("Driver ID not found in token. Please login again.");
    } catch (err) {
      console.error("JWT decode error:", err);
      handleError("Invalid token. Please login again.");
    }
  }, []);

  // normalize various response shapes into an array of records
  const normalizeRecordsResponse = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.records)) return data.records;
    if (Array.isArray(data.data)) return data.data;
    if (data.record && typeof data.record === "object") return [data.record];
    if (data.records && typeof data.records === "object") return [data.records];
    if (typeof data === "object") return [data];
    return [];
  };

  // fetch records for driver
  useEffect(() => {
    if (!driverId) return;

    const fetchRecords = async () => {
      const token = localStorage.getItem("driverToken");
      if (!token) return;

      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:8080/api/bookings/driver/${driverId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // handle different response shapes
        const normalized = normalizeRecordsResponse(res.data.records ?? res.data);
        const enriched = normalized.map((r) => ({ ...r, tempArrivalTime: r.arrivalTime || "", showInput: false }));
        setRecords(enriched);
      } catch (err) {
        console.error("Error fetching records:", err);
        const msg = err.response?.data?.message || "Error fetching records";
        handleError(msg);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [driverId]);

  // helper to update a single record in local state
  const updateRecordLocal = (id, patch) => {
    setRecords((prev) => prev.map((r) => ((r._id === id || r.id === id) ? { ...r, ...patch } : r)));
  };

  // confirm record (driver confirms arrivalTime) — uses driverId directly
  const handleConfirm = async (recordId, arrivalTime) => {
    if (!arrivalTime || arrivalTime.toString().trim() === "") {
      return handleError("Please enter an arrival time before confirming.");
    }
    const token = localStorage.getItem("driverToken");
    if (!token) return;

    try {
      // 1) Confirm the booking/record on the server
      const confirmRes = await axios.put(
        `http://localhost:8080/api/bookings/confirm/${recordId}`,
        { arrivalTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Parse the server-returned record (handle different shapes)
      const serverRecord = confirmRes?.data?.record ?? confirmRes?.data?.booking ?? confirmRes?.data;

      // Update local state using the server canonical record if available,
      // otherwise optimistically update status/arrivalTime.
      if (serverRecord && (serverRecord._id || serverRecord.id)) {
        const id = serverRecord._id || serverRecord.id;
        updateRecordLocal(id, { ...serverRecord, showInput: false, tempArrivalTime: serverRecord.arrivalTime || "" });
      } else {
        updateRecordLocal(recordId, { status: "confirmed", arrivalTime, showInput: false, tempArrivalTime: arrivalTime });
      }

      handleSuccess("Record confirmed!");

      // 2) Update driver availability -> false (use driverId state)
      if (!driverId) {
        console.warn("driverId not present — skipping availability update.");
        return;
      }

      try {
        // NOTE: route uses plural 'drivers' to match getAllDrivers usage
        const avRes = await axios.put(
          `http://localhost:8080/api/auth/driver/availability/${driverId}`,
          { available: false },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (avRes.data && avRes.data.success) {
          // update local driverInfo + localStorage so UI reflects new availability
          setDriverInfo((prev) => {
            const updated = { ...(prev || {}), available: false };
            try {
              localStorage.setItem("driver", JSON.stringify(updated));
            } catch (e) {
              /* ignore localStorage errors */
            }
            return updated;
          });
        }
      } catch (err) {
        console.error("Failed updating driver availability:", err);
        // availability update failure should not roll back the confirmed record.
        const msg = err.response?.data?.message || "Failed to update availability";
        handleError(msg);
      }
    } catch (err) {
      console.error("Error confirming record:", err);
      const msg = err.response?.data?.message || "Error confirming record";
      handleError(msg);
    }
  };

  // cancel record
  const handleCancel = async (recordId) => {
    const token = localStorage.getItem("driverToken");
    if (!token) return;

    try {
      await axios.put(
        `http://localhost:8080/api/bookings/cancel/${recordId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      handleSuccess("Record cancelled!");
      updateRecordLocal(recordId, { status: "cancelled", showInput: false });
    } catch (err) {
      console.error("Error cancelling record:", err);
      const msg = err.response?.data?.message || "Error cancelling record";
      handleError(msg);
    }
  };

  // local UI helpers
  const toggleShowInput = (id) => {
    updateRecordLocal(id, { showInput: true });
  };

  const handleArrivalChange = (id, value) => {
    updateRecordLocal(id, { tempArrivalTime: value });
  };

  // safety guard
  const safeRecords = Array.isArray(records) ? records : [];

  return (
    <div className="container">
      {/* Profile */}
      {driverInfo && (
        <div className="profile-card">
          <div className="avatar">{driverInfo.name ? driverInfo.name.charAt(0).toUpperCase() : "D"}</div>
          <h2>Welcome, {driverInfo.name} 👨‍🔧</h2>
          <p><strong>Email:</strong> {driverInfo.email}</p>
          <p><strong>Phone:</strong> {driverInfo.phone}</p>
          <p><strong>Available:</strong> {driverInfo.available ? "Yes" : "No"}</p>
        </div>
      )}

      <h2>Your Records</h2>

      {loading ? (
        <p>Loading records...</p>
      ) : safeRecords.length === 0 ? (
        <p>No records yet.</p>
      ) : (
        safeRecords.map((r) => {
          const user = r.userId || r.user || null;
          const createdAt = r.createdAt || r.created_at || null;
          const key = r._id || r.id || JSON.stringify(r).slice(0, 12);

          return (
            <div
              className={`card ${r.status === "confirmed" ? "card-confirmed" : r.status === "pending" ? "card-pending" : r.status === "cancelled" ? "card-cancelled" : ""}`}
              key={key}
            >
              <div className="card-sections">
                {/* USER INFO */}
                <div className="card-section">
                  <h3>User Info</h3>
                  <p><strong>Name:</strong> {user?.name || "Unknown"}</p>
                  <p><strong>Phone:</strong> {user?.phone || "N/A"}</p>
                </div>

                {/* RECORD INFO */}
                <div className="card-section">
                  <h3>Record Info</h3>
                  {r.ambulanceType && <p><strong>Ambulance Type:</strong> {r.ambulanceType}</p>}
                  {r.hospitalLocation?.name && <p><strong>Hospital:</strong> {r.hospitalLocation.name}</p>}
                </div>

                {/* STATUS */}
                <div className="card-section">
                  <h3>Booking Status</h3>
                  <p><strong>Status:</strong> {r.status || "N/A"}</p>
                  {r.status === "confirmed" && r.arrivalTime && <p><strong>Arrival Time:</strong> {r.arrivalTime}</p>}
                  {createdAt && <p><strong>Created At:</strong> {new Date(createdAt).toLocaleString()}</p>}
                </div>
              </div>

              {/* ACTIONS */}
              <div className="card-actions">
                {r.status === "pending" && (
                  <>
                    {!r.showInput ? (
                      <button className="btn" onClick={() => toggleShowInput(r._id || r.id)}>Confirm</button>
                    ) : (
                      <>
                        <input
                          type="text"
                          className="input"
                          placeholder="Enter arrival time (e.g., 20 mins)"
                          value={r.tempArrivalTime || ""}
                          onChange={(e) => handleArrivalChange(r._id || r.id, e.target.value)}
                        />
                        <button className="btn" onClick={() => handleConfirm(r._id || r.id, r.tempArrivalTime)}>Submit</button>
                      </>
                    )}

                    <button className="btn cancel-btn" onClick={() => handleCancel(r._id || r.id)} style={{ backgroundColor: "red", color: "#fff" }}>
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })
      )}

      <div className="button-row">
        <button className="btn" style={{ backgroundColor: "green", color: "white" }} onClick={() => navigate("/mapview")}>
          Go to Map
        </button>

        <button className="logout-button" onClick={Logout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default DriverDashboard;
