import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { handleError, handleSuccess } from "../utils";
import "react-toastify/dist/ReactToastify.css";
import "../styles/auth.css";
import logo from "../assets/logo.png";

function UserLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get the path user tried to visit before being redirected to login
  const from = location.state?.from || "/";

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      return handleError("Email and password are required");
    }

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:8080/api/auth/login", {
        email,
        password,
      });
      setLoading(false);

      // Save user data
      localStorage.setItem("userToken", res.data.token);
      localStorage.setItem("justLoggedIn", "true");
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("role", "user");

      handleSuccess("Login successful");

      // Navigate back to intended page or fallback
      setTimeout(() => navigate(from, { replace: true }), 1500);
    } catch (err) {
      setLoading(false);
      console.error(err);
      const errorMsg =
        err.response?.data?.message ||
        "Login failed. Please check your credentials.";
      handleError(errorMsg);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <img src={logo} alt="Logo" className="auth-logo" />
        <h1>User Login</h1>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          <span className="auth-footer">
            Don’t have an account? <Link to="/user-signup">Signup</Link>
          </span>
        </form>
      </div>
    </div>
  );
}

export default UserLogin;
