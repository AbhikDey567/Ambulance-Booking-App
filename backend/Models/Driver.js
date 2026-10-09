const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  experience: { type: Number, required: true, min: 0 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 4 },

  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },

  // EXTRA FIELDS
  typeOfAmbulance: {
    type: String,
    required: true,
    enum: ["BLS", "ALS", "Patient Transport", "Mortuary", "Neonatal"],
    trim: true
  },

  available: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
