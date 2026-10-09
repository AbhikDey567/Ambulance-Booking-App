import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();

  let timer;
  const navRef = useRef(null);
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleMouseEnter = (menu) => {
    clearTimeout(timer);
    setOpenDropdown(menu);
  };

  const handleMouseLeave = () => {
    timer = setTimeout(() => {
      setOpenDropdown(null);
    }, 250);
  };

  // Read auth state from localStorage
  useEffect(() => {
  const storedRole = localStorage.getItem("role");
  const userToken = localStorage.getItem("userToken");
  const driverToken = localStorage.getItem("driverToken");

  if (storedRole === "user" && userToken) {
    setRole("user");
    setIsLoggedIn(true);
  } else if (storedRole === "driver" && driverToken) {
    setRole("driver");
    setIsLoggedIn(true);
  } else {
    setRole(null);
    setIsLoggedIn(false);
  }
}, [location]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close menu when a link is clicked
  const handleLinkClick = () => {
    setIsOpen(false);
    setOpenDropdown(null);
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("driverToken");
    localStorage.removeItem("role");

    setRole(null);
    setIsLoggedIn(false);
    handleLinkClick();
    navigate("/"); // go back to home
  };

  return (
    <nav className="navbar" ref={navRef}>
      {/* Logo Section */}
      <div className="navbar-logo">
        <Link to="/" onClick={handleLinkClick} className="logo-link">
          <img
            src="/images/UEFA_Champions_League.svg.png"
            alt="Logo"
            className="nav-logo"
          />
          <span>Fastrack</span>
        </Link>
      </div>

      {/* Hamburger menu for mobile */}
      <div className={`hamburger ${isOpen ? "open" : ""}`} onClick={toggleMenu}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </div>

      <div className={`nav-links ${isOpen ? "open" : ""}`}>
        {/* Public Links */}
        <Link to="/" onClick={handleLinkClick}>Home</Link>
        <Link to="/about" onClick={handleLinkClick}>About</Link>
        <Link to="/contact" onClick={handleLinkClick}>Contact</Link>

        {/* Services Dropdown */}
        <div
          className="dropdown"
          onMouseEnter={() => handleMouseEnter("services")}
          onMouseLeave={handleMouseLeave}
        >
          <span className="dropdown-toggle">Services</span>
          <div className={`dropdown-menu ${openDropdown === "services" ? "show" : ""}`}>
            <Link to="/find-drivers" onClick={handleLinkClick}>Find Drivers</Link>
            <Link to="/mapview" onClick={handleLinkClick}>Driver MapView</Link>
          </div>
        </div>

        {/* Dashboard (role-based) */}
        {isLoggedIn && (
          <div
            className="dropdown"
            onMouseEnter={() => handleMouseEnter("dashboards")}
            onMouseLeave={handleMouseLeave}
          >
            <span className="dropdown-toggle">Dashboard</span>
            <div className={`dropdown-menu ${openDropdown === "dashboards" ? "show" : ""}`}>
              {role === "driver" && (
                <Link to="/driver-dashboard" onClick={handleLinkClick}>
                  Driver Dashboard
                </Link>
              )}
              {role === "user" && (
                <Link to="/user-dashboard" onClick={handleLinkClick}>
                  User Dashboard
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Auth buttons */}
        {!isLoggedIn && (
          <>
            {/* Logins Dropdown */}
            <div
              className="dropdown"
              onMouseEnter={() => handleMouseEnter("logins")}
              onMouseLeave={handleMouseLeave}
            >
              <span className="dropdown-toggle login-btn">Login</span>
              <div className={`dropdown-menu ${openDropdown === "logins" ? "show" : ""}`}>
                <Link to="/login" onClick={handleLinkClick}>Driver Login</Link>
                <Link to="/user-login" onClick={handleLinkClick}>User Login</Link>
              </div>
            </div>

            {/* Signups Dropdown */}
            <div
              className="dropdown"
              onMouseEnter={() => handleMouseEnter("signups")}
              onMouseLeave={handleMouseLeave}
            >
              <span className="dropdown-toggle signup-btn">Signup</span>
              <div className={`dropdown-menu ${openDropdown === "signups" ? "show" : ""}`}>
                <Link to="/signup" onClick={handleLinkClick}>Driver Signup</Link>
                <Link to="/user-signup" onClick={handleLinkClick}>User Signup</Link>
              </div>
            </div>
          </>
        )}

        {/* Logout when logged in */}
        {isLoggedIn && (
        <div
         className="dropdown-toggle login-btn"
         onClick={handleLogout}
         style={{ cursor: "pointer" }}
        >
        Logout
        </div>
        )}

      </div>
    </nav>
  );
}
