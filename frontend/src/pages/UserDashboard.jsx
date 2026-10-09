import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { handleError, handleSuccess } from "../utils";
import useHandleLogout from "../hooks/useHandleLogout";
import "./MechanicDashboard.css";

function UserDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const token = localStorage.getItem("userToken");
  const Logout = useHandleLogout("user");

  useEffect(() => {
    if (!token) return;
    try {
      const decoded = jwtDecode(token);
      const uid = decoded?._id || decoded?.id;
      if (uid) setUserId(uid);
    } catch {
      handleError("Invalid token.");
    }

    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUserInfo(JSON.parse(stored));
      } catch {}
    }
  }, [token]);

  const normalizeRecords = (data) => {
    if (!data) return [];
    if (Array.isArray(data.records)) return data.records;
    if (Array.isArray(data)) return data;
    if (data.record) return [data.record];
    return [];
  };

  useEffect(() => {
    if (!userId || !token) return;

    const fetchRecords = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:8080/api/bookings/user/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRecords(normalizeRecords(res.data));
      } catch (err) {
        handleError("Failed to fetch records");
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [userId, token]);

  const handleDelete = async (recordId) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      await axios.delete(
        `http://localhost:8080/api/bookings/delete/${recordId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecords((prev) => prev.filter((r) => r._id !== recordId));
      handleSuccess("Record deleted");
    } catch (err) {
      handleError("Failed to delete record");
    }
  };

  if (!userId || !token) return <p>Please login.</p>;

  return (
    <div className="container">
      {userInfo && (
        <div className="profile-card">
          <div className="avatar">
            {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : "U"}
          </div>
          <h2>Welcome, {userInfo.name}</h2>
          <p><strong>Email:</strong> {userInfo.email}</p>
          <p><strong>Phone:</strong> {userInfo.phone}</p>
        </div>
      )}

      <h2>Your Records</h2>

      {loading ? (
        <p>Loading...</p>
      ) : records.length === 0 ? (
        <p>No records yet.</p>
      ) : (
        records.map((r) => {
          const driver = r.driverId || {};
          return (
            <div
              key={r._id}
              className={`card ${
                r.status === "confirmed"
                  ? "card-confirmed"
                  : r.status === "pending"
                  ? "card-pending"
                  : r.status === "cancelled"
                  ? "card-cancelled"
                  : ""
              }`}
            >
              <div className="card-sections">
                <div className="card-section">
                  <h3>Driver Info</h3>
                  <p><strong>Name:</strong> {driver.name || "Unknown"}</p>
                  <p><strong>Phone:</strong> {driver.phone || "N/A"}</p>
                </div>

                <div className="card-section">
                  <h3>Record Info</h3>
                  <p><strong>Ambulance Type:</strong> {r.ambulanceType}</p>
                  {r.hospitalLocation?.name && (
                    <p><strong>Hospital:</strong> {r.hospitalLocation.name}</p>
                  )}
                </div>

                <div className="card-section">
                  <h3>Status</h3>
                  <p><strong>Status:</strong> {r.status}</p>

                  {r.status === "confirmed" && r.arrivalTime && (
                    <p><strong>ETA:</strong> {r.arrivalTime}</p>
                  )}

                  <p>
                    <strong>Created:</strong>{" "}
                    {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* DELETE BUTTON: ONLY pending/cancelled */}
              {(r.status === "pending" || r.status === "cancelled") ? (
                <div className="card-actions">
                  <button
                    className="btn delete-btn"
                    onClick={() => handleDelete(r._id)}
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <div className="card-actions">
                  <button
                    className="btn delete-btn"
                    disabled
                    style={{
                      opacity: 0.5,
                      cursor: "not-allowed",
                      pointerEvents: "none",
                    }}
                  >
                    Cannot Delete
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}

      <button className="logout-button" onClick={Logout}>
        Logout
      </button>
    </div>
  );
}

export default UserDashboard;
