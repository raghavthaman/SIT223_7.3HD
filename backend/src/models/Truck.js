const mongoose = require('mongoose');

const truckSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  currentLocation: {
    type: [Number], // [lat, lng]
    required: true
  },
  speed: {
    type: Number,
    default: 0
  },
  distanceRemaining: {
    type: Number,
    default: 0
  },
  etaMinutes: {
    type: Number,
    default: 0
  },
  targetBinId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bin',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Truck', truckSchema);
