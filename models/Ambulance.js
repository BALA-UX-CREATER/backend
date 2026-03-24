const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema({
  ambulanceId: { type: String, unique: true },
  vehicleNumber: { type: String, required: true },
  district: { type: String, required: true },
  currentLocation: { lat: { type: Number, required: true }, lng: { type: Number, required: true } },
  status: { type: String, enum: ['Available', 'On Duty', 'Maintenance'], default: 'Available' },
  destination: { lat: Number, lng: Number },
  route: [{ lat: Number, lng: Number }],
  speed: { type: Number, default: 40 },
  lastUpdate: { type: Date, default: Date.now },
  driver: {
    name: { type: String, default: 'Driver' },
    phone: { type: String, default: '9999999999' }
  }
});

ambulanceSchema.pre('save', function(next) {
  if (!this.ambulanceId) {
    this.ambulanceId = 'AMB' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Ambulance', ambulanceSchema);
