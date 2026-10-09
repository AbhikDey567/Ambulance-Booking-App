import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { handleSuccess, handleError } from "../utils";
import '../styles/auth.css';
import logo from '../assets/logo.png';

function UserSignup() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, phone, password } = form;

    if (!name || !email || !phone || !password) {
      return handleError("All fields are required");
    }

    if (password.length < 6) {
      return handleError("Password should be at least 6 characters");
    }

    try {
      setLoading(true);
      await axios.post("http://localhost:8080/api/auth/signup", form);
      setLoading(false);
      handleSuccess("Registration successful!");
      setForm({ name: '', email: '', phone: '', password: '' });
      setTimeout(() => navigate("/user-login"), 1500);
    } catch (err) {
      setLoading(false);
      console.error(err);
      handleError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <img src={logo} alt="CarFix Logo" className="auth-logo" />
        <h1 className="auth-title">Create Your Account</h1>

        <form onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="10-digit mobile number"
              pattern="[0-9]{10}"
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>

          <p className="auth-footer">
            Already have an account?{" "}
            <Link to="/user-login" className="auth-link">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default UserSignup;
