const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  sensorId: { type: String, unique: true },
  type: { type: String, enum: ['Flood Sensor', 'Road Sensor', 'Traffic Camera', 'Weather Station'], required: true },
  district: { type: String, required: true },
  location: { lat: Number, lng: Number },
  readings: {
    waterLevel: { type: Number, default: 0 },
    vibration: { type: Number, default: 0 },
    trafficFlow: { type: Number, default: 0 },
    temperature: { type: Number, default: 28 },
    humidity: { type: Number, default: 65 },
    airQuality: { type: Number, default: 80 }
  },
  alert: { type: Boolean, default: false },
  alertMessage: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SensorData', sensorDataSchema);
