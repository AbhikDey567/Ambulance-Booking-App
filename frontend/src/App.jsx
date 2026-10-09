import { Route, Routes } from "react-router-dom";
import "./App.css";

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import FindDrivers from "./pages/FindDrivers";
import MapView from "./pages/MapView";
import DriverDashboard from "./pages/DriverDashboard";
import UserDashboard from "./pages/UserDashboard";
import UserLogin from "./pages/UserLogin";
import UserSignup from "./pages/UserSignup";

// Components
import RefreshHandler from "./RefreshHandler";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <div className="app">
      <Navbar />

      {/* RefreshHandler can stay here if needed for token refresh */}
      <RefreshHandler />

      <main className="main-content">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/user-login" element={<UserLogin />} />
          <Route path="/user-signup" element={<UserSignup />} />

          {/* Driver protected routes */}
          <Route
            path="/driver-dashboard"
            element={
              <ProtectedRoute role="driver">
                <DriverDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mapview"
            element={
              <ProtectedRoute role="driver">
                <MapView />
              </ProtectedRoute>
            }
          />

          {/* User protected routes */}
          <Route
            path="/find-drivers"
            element={
              <ProtectedRoute role="user">
                <FindDrivers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-dashboard"
            element={
              <ProtectedRoute role="user">
                <UserDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <Footer />

      <ToastContainer />
    </div>
  );
}

export default App;
