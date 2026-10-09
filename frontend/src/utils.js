import { toast } from "react-toastify";

// Default toast configuration
const toastConfig = {
  position: "top-right",
  autoClose: 3000,      // closes after 3s
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "colored",     // "light" | "dark" | "colored"
};

// Success toast
export const handleSuccess = (message) => {
  toast.success(message, toastConfig);
};

// Error toast
export const handleError = (message) => {
  toast.error(message, toastConfig);
};

// Info toast
export const handleInfo = (message) => {
  toast.info(message, toastConfig);
};

// Warning toast
export const handleWarning = (message) => {
  toast.warning(message, toastConfig);
};

// Optional: Generic toast function for dynamic types
export const showToast = (type, message) => {
  switch (type) {
    case "success":
      handleSuccess(message);
      break;
    case "error":
      handleError(message);
      break;
    case "info":
      handleInfo(message);
      break;
    case "warning":
      handleWarning(message);
      break;
    default:
      toast(message, toastConfig);
  }
};
