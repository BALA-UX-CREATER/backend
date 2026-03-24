const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
  districtId: { type: String, unique: true },
  name: { type: String, required: true },
  code: String,
  population: Number,
  area: Number,
  alertCount: { type: Number, default: 0 },
  healthScore: { type: Number, default: 85 },
  coordinates: { lat: Number, lng: Number },
  type: { type: String, enum: ['coastal', 'interior', 'hill', 'industrial'], default: 'interior' }
});

module.exports = mongoose.model('District', districtSchema);
