const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  // Who made the booking
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Which driver is recorded
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },

  // Pickup location (user)
  userLocation: {
    address: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number }
  },

  // Optional hospital details (drop location)
  hospitalLocation: {
    name: { type: String },
    address: { type: String },
    lat: { type: Number },
    lng: { type: Number }
  },

  // 🚑 Only keep ambulance type (required)
  ambulanceType: { 
    type: String, 
    enum: ['BLS', 'ALS', 'ICU', 'NEONATAL', 'MORTUARY'], 
    required: true 
  },

  // Status of the record
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'completed'], 
    default: 'pending' 
  },

  // Optional estimated arrival time
  arrivalTime: { type: String },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Record', recordSchema);
