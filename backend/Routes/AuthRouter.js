const router = require('express').Router();
const {
  signup,
  login,
  driverSignup,
  driverLogin,
  getAllDrivers,
  updateDriverAvailability
} = require('../Controllers/AuthController');

const {
  userSignupValidation,
  userLoginValidation,
  driverSignupValidation,
  driverLoginValidation,
  verifyToken,
  verifyRole
} = require('../Middlewares/AuthValidation');

// ==========================
// USER ROUTES
// ==========================
router.post('/signup', userSignupValidation, signup);
router.post('/login', userLoginValidation, login);

// ==========================
// MECHANIC ROUTES
// ==========================
router.post('/driver/signup', driverSignupValidation, driverSignup);
router.post('/driver/login', driverLoginValidation, driverLogin);

// ==========================
// PROTECTED ROUTE
// ==========================
router.put("/driver/availability/:id", verifyToken, verifyRole(["driver"]), updateDriverAvailability);

router.get('/driver/profile', verifyToken, (req, res) => {
  if (req.user.role !== 'driver') {
    return res.status(403).json({ message: "Forbidden: Not a driver" });
  }
  res.json({ message: "Driver profile access granted", user: req.user });
});

router.get('/user/profile', verifyToken, (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ message: "Forbidden: Not a user" });
  }
  res.json({ message: "User profile access granted", user: req.user });
});
router.get('/drivers/all', getAllDrivers);

module.exports = router;
