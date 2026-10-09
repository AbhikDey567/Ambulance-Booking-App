import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const useHandleLogout = (role) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (role === "user") {
      localStorage.removeItem("userToken");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
    } else if (role === "driver") {
      localStorage.removeItem("driverToken");
      localStorage.removeItem("driver");
      localStorage.removeItem("role");
    }

    toast.success("Logged out successfully");

    // Delay redirect slightly so toast is visible
    setTimeout(() => {
      navigate("/", { replace: true }); 
    }, 500);
  };

  return handleLogout;
};

export default useHandleLogout;
