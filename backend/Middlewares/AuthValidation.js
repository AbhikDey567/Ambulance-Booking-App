const Joi = require('joi');
const jwt = require('jsonwebtoken');

// ==========================
// USER SIGNUP & LOGIN SCHEMAS
// ==========================
const userSignupSchema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().min(8).max(15).required(), 
    password: Joi.string().min(4).max(100).required()
});


const userLoginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(4).max(100).required()
});

// ==========================
// DRIVER SIGNUP & LOGIN SCHEMAS
// ==========================
const driverSignupSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  phone: Joi.string().min(8).max(15).required(),
  experience: Joi.number().min(0).max(60).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(4).max(100).required(),

  typeOfAmbulance: Joi.string()
    .valid("BLS", "ALS", "Patient Transport", "Mortuary", "Neonatal")
    .required(),

  available: Joi.boolean().default(true),

  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  }).required(),
});


const driverLoginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(4).max(100).required()
});

// ==========================
// VALIDATION MIDDLEWARES
// ==========================
const userSignupValidation = (req, res, next) => {
    const { error } = userSignupSchema.validate(req.body);
    if (error) return res.status(400).json({ message: "Validation failed", error: error.details[0].message });
    next();
};

const userLoginValidation = (req, res, next) => {
    const { error } = userLoginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: "Validation failed", error: error.details[0].message });
    next();
};

const driverSignupValidation = (req, res, next) => {
    const { error } = driverSignupSchema.validate(req.body);
    if (error) return res.status(400).json({ message: "Validation failed", error: error.details[0].message });
    next();
};

const driverLoginValidation = (req, res, next) => {
    const { error } = driverLoginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: "Validation failed", error: error.details[0].message });
    next();
};

// ==========================
// JWT TOKEN HELPERS
// ==========================
// Generate JWT with user payload
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Verify JWT and attach user to request
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
  if (!token) return res.status(403).json({ message: "Access denied, token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // decoded = { _id, role, ... }
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Verify user role (authorization)
const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }
    next();
  };
};
module.exports = {
    userSignupValidation,
    userLoginValidation,
    driverSignupValidation,
    driverLoginValidation,
    generateToken,
    verifyToken, 
    verifyRole
};
