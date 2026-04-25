const mongoose = require('mongoose');

const binSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true
  },
  fillLevel: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['Normal', 'Warning', 'Critical'],
    default: 'Normal'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  feedback: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String, // Simulate base64 string
    default: ''
  },
  isCollected: {
    type: Boolean,
    default: false
  },
  coords: {
    type: [Number], // [lat, lng]
    default: [0, 0]
  }
}, { timestamps: true });

module.exports = mongoose.model('Bin', binSchema);
