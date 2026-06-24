const mongoose = require('mongoose');

const guestLimitSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    unique: true,
  },
  scanCount: {
    type: Number,
    default: 0,
  },
  lastScanAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('GuestLimit', guestLimitSchema);
