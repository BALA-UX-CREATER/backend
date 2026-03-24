const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  incidentId: { type: String, unique: true },
  type: { type: String, enum: ['Flood', 'Pothole', 'Traffic', 'Assault', 'Fire', 'Accident', 'Water Logging'], required: true },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  location: { lat: { type: Number, required: true }, lng: { type: Number, required: true } },
  district: { type: String, required: true },
  address: { type: String, default: '' },
  status: { type: String, enum: ['New', 'Assigned', 'In Progress', 'Resolved'], default: 'New' },
  reportedBy: { type: String, default: 'system' },
  reportedAt: { type: Date, default: Date.now },
  resolvedAt: Date,
  images: [String],
  description: { type: String, default: '' },
  sensorData: {
    waterLevel: Number,
    vibration: Number,
    trafficDensity: Number,
    temperature: Number
  }
});

incidentSchema.pre('save', function(next) {
  if (!this.incidentId) {
    this.incidentId = 'INC' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Incident', incidentSchema);
