const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require("../Models/User");
const DriverModel = require("../Models/Driver");
const { generateToken } = require("../Middlewares/AuthValidation");

// ==========================
// USER AUTH
// ==========================
const signup = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                message: 'User already exists, you can login',
                success: false
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new UserModel({ 
            name, 
            email, 
            phone, 
            password: hashedPassword 
        });
        await user.save();

        const token = generateToken({ _id: user._id, email: user.email, role: 'user' });

        res.status(201).json({
            message: "Signup successful",
            success: true,
            token,
            user: { 
                _id: user._id, 
                name: user.name, 
                email: user.email,
                phone: user.phone   // send phone back
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Internal server error", success: false });
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });
        const errorMsg = 'Auth failed: email or password is wrong';

        if (!user) return res.status(403).json({ message: errorMsg, success: false });

        const isPassEqual = await bcrypt.compare(password, user.password);
        if (!isPassEqual) return res.status(403).json({ message: errorMsg, success: false });

        const token = generateToken({ _id: user._id, email: user.email, role: 'user' });

        res.status(200).json({
            message: "Login successful",
            success: true,
            token,
            user: { 
                _id: user._id, 
                name: user.name, 
                email: user.email,
                phone: user.phone,
                location: user.location   
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Internal server error", success: false });
    }
};

// ==========================
// DRIVER AUTH
// ==========================
// DRIVER SIGNUP (updated to match frontend that doesn't send `available`)
const driverSignup = async (req, res) => {
  try {
    const {
      name,
      phone,
      experience,
      email,
      password,
      location,
      typeOfAmbulance,
      // removed `available` from destructuring — frontend doesn't send it
    } = req.body;

    // Basic validation
    if (
      !name ||
      !phone ||
      experience === undefined ||
      experience === null ||
      isNaN(Number(experience)) ||
      Number(experience) < 0 ||
      !email ||
      !password ||
      !location ||
      typeof location.lat !== "number" ||
      typeof location.lng !== "number" ||
      !typeOfAmbulance
    ) {
      return res
        .status(400)
        .json({ message: "Invalid or missing fields", success: false });
    }

    // Validate ambulance types (keep in sync with frontend)
    const ALLOWED_AMBULANCE_TYPES = [
      "BLS",
      "ALS",
      "Patient Transport",
      "Mortuary",
      "Neonatal",
    ];
    if (!ALLOWED_AMBULANCE_TYPES.includes(typeOfAmbulance)) {
      return res
        .status(400)
        .json({ message: "Invalid ambulance type", success: false });
    }

    // check existing driver by email
    const existingDriver = await DriverModel.findOne({ email });
    if (existingDriver) {
      return res
        .status(409)
        .json({ message: "Driver already exists", success: false });
    }

    // hash password and create driver
    const hashedPassword = await bcrypt.hash(password, 10);

    const driver = new DriverModel({
      name,
      phone,
      experience: Number(experience),
      email,
      password: hashedPassword,
      location: {
        lat: location.lat,
        lng: location.lng,
      },
      typeOfAmbulance,
    });

    await driver.save();

    const token = generateToken({
      _id: driver._id,
      email: driver.email,
      role: "driver",
    });

    res.status(201).json({
      message: "Driver signup successful",
      success: true,
      token,
      driver: {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        experience: driver.experience,
        location: driver.location,
        typeOfAmbulance: driver.typeOfAmbulance,
        available: driver.available, 
      },
    });
  } catch (err) {
    console.error("driverSignup error:", err);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

const driverLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const driver = await DriverModel.findOne({ email });
        const errorMsg = 'Auth failed: email or password is wrong';

        if (!driver) return res.status(403).json({ message: errorMsg, success: false });

        const isPassEqual = await bcrypt.compare(password, driver.password);
        if (!isPassEqual) return res.status(403).json({ message: errorMsg, success: false });

        const token = generateToken({ _id: driver._id, email: driver.email, role: 'driver' });

        res.status(200).json({
            message: "Driver login successful",
            success: true,
            token,
            driver: {
                _id: driver._id,
                name: driver.name,
                email: driver.email,
                phone: driver.phone,
                experience: driver.experience,
                location: driver.location
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Internal server error", success: false });
    }
};
//Get all drivers
const getAllDrivers = async (req, res) => {
  try {
    const role = req.headers["x-user-role"];

    if (!["user", "admin"].includes(role)) {
      return res.status(403).json({ success: false, message: "Forbidden: Not authorized" });
    }

    const drivers = await DriverModel.find({});
    res.status(200).json({ success: true, drivers });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch drivers" });
  }
};
// updateDriverAvailability controller
const updateDriverAvailability = async (req, res) => {
  try {
    // If admin wants to update another driver, provide :id param.
    // Otherwise driver updates their own availability via req.user._id (set by verifyToken).
    const targetDriverId = req.params.id || req.user?._id;

    if (!targetDriverId) {
      return res.status(400).json({ success: false, message: "Driver id missing" });
    }

    // available should be provided in body; accept boolean or "true"/"false"
    let { available } = req.body;

    if (available === undefined || available === null) {
      return res.status(400).json({ success: false, message: "Missing 'available' in request body" });
    }

    // coerce string -> boolean if necessary
    if (typeof available === "string") {
      if (available.toLowerCase() === "true") available = true;
      else if (available.toLowerCase() === "false") available = false;
    }

    if (typeof available !== "boolean") {
      return res.status(400).json({ success: false, message: "'available' must be a boolean" });
    }

    // Update the driver document
    const updatedDriver = await DriverModel.findByIdAndUpdate(
      targetDriverId,
      { available },
      { new: true, runValidators: true }
    ).select("-password"); // hide password

    if (!updatedDriver) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Driver availability updated",
      driver: {
        _id: updatedDriver._id,
        name: updatedDriver.name,
        phone: updatedDriver.phone,
        email: updatedDriver.email,
        experience: updatedDriver.experience,
        location: updatedDriver.location,
        typeOfAmbulance: updatedDriver.typeOfAmbulance,
        available: updatedDriver.available,
      },
    });
  } catch (err) {
    console.error("updateDriverAvailability error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { signup, login, driverSignup, driverLogin, getAllDrivers, updateDriverAvailability };
