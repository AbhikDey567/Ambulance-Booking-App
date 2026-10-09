import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { handleError, handleSuccess } from '../utils'; 
import 'react-toastify/dist/ReactToastify.css';
import '../styles/auth.css'; 
import logo from '../assets/logo.png';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Default redirect after login
  const redirectPath = location.state?.from || "/"; // if no origin page, go to homepage

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      return handleError("Email and password are required");
    }

    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:8080/api/auth/driver/login",
        { email, password }
      );
      setLoading(false);

      // Store driver info & token
      localStorage.setItem("driverToken", res.data.token);
      localStorage.setItem("justLoggedIn", "true");
      localStorage.setItem("driver", JSON.stringify(res.data.driver));
      localStorage.setItem("role", "driver");

      handleSuccess("Login successful");

      // Redirect to origin page
      setTimeout(() => navigate(redirectPath, { replace: true }), 1000);
    } catch (err) {
      setLoading(false);
      console.error(err);
      const errorMsg = err.response?.data?.message || "Login failed. Please check your credentials.";
      handleError(errorMsg);
    }
  };

  return (
    <div className='auth-container'>
      <div className='auth-box'>
        <img src={logo} alt="Logo" className='auth-logo' />
        <h1>Driver Login</h1>
        <form onSubmit={handleLogin}>
          <div className='input-group'>
            <label htmlFor='email'>Email</label>
            <input
              type='email'
              name='email'
              placeholder='Enter your email...'
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className='input-group'>
            <label htmlFor='password'>Password</label>
            <input
              type='password'
              name='password'
              placeholder='Enter your password...'
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type='submit' className='auth-button' disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          <span className='auth-footer'>
            Don’t have an account? <Link to="/signup">Signup</Link>
          </span>
        </form>
      </div>
    </div>
  );
}

export default Login;
