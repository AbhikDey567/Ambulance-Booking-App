import React, { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { handleError } from "../utils";

function ProtectedRoute({ children, role }) {
  const storedRole = localStorage.getItem("role");
  const userToken = localStorage.getItem("userToken");
  const driverToken = localStorage.getItem("driverToken");

  const [redirectPath, setRedirectPath] = useState(null);
  const [checking, setChecking] = useState(true); // prevents flicker
  const hasFiredToast = useRef(false);
  const location = useLocation(); // get current path

  useEffect(() => {
    if (role === "user" && (!userToken || storedRole !== "user")) {
      if (!hasFiredToast.current) {
        handleError("Please login as User to continue.");
        hasFiredToast.current = true;
      }
      setRedirectPath("/user-login");
    }

    if (role === "driver" && (!driverToken || storedRole !== "driver")) {
      if (!hasFiredToast.current) {
        handleError("Please login as Driver to continue.");
        hasFiredToast.current = true;
      }
      setRedirectPath("/login"); // explicit login path for drivers
    }

    setChecking(false);
  }, [role, storedRole, userToken, driverToken]);

  if (checking) return null; // optional loader here
  if (redirectPath) {
    // Pass the attempted URL to the login page using state
    return <Navigate to={redirectPath} replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default ProtectedRoute;
