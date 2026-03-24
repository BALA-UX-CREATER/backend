const db = require('../db');

let io = null;
let simulationInterval = null;

const DISTRICT_PROFILES = {
  'Chennai':       { baseTemp: 32, baseHumidity: 80, floodRisk: 0.7 },
  'Coimbatore':    { baseTemp: 28, baseHumidity: 60, floodRisk: 0.3 },
  'Madurai':       { baseTemp: 34, baseHumidity: 55, floodRisk: 0.3 },
  'Nilgiris':      { baseTemp: 18, baseHumidity: 85, floodRisk: 0.5 },
  'Nagapattinam':  { baseTemp: 30, baseHumidity: 82, floodRisk: 0.8 },
  'Kanyakumari':   { baseTemp: 29, baseHumidity: 80, floodRisk: 0.6 },
  'Thoothukkudi':  { baseTemp: 31, baseHumidity: 75, floodRisk: 0.5 },
  'default':       { baseTemp: 30, baseHumidity: 65, floodRisk: 0.3 }
};

function getProfile(district) {
  return DISTRICT_PROFILES[district] || DISTRICT_PROFILES['default'];
}

function isRushHour() {
  const h = new Date().getHours();
  return (h >= 8 && h <= 10) || (h >= 17 && h <= 19);
}

function rand(min, max) { return Math.random() * (max - min) + min; }

async function updateSensors() {
  try {
    const sensors = await db.sensors.find({});
    const newAlerts = [];

    for (const sensor of sensors) {
      const readings = { ...sensor.readings };
      let alert = false;
      let alertMessage = '';
      const profile = getProfile(sensor.district);

      if (sensor.type === 'Flood Sensor') {
        const base = readings.waterLevel || 5;
        const rain = Math.random() < 0.1 ? rand(2, 8) : rand(-1, 1);
        readings.waterLevel = parseFloat(Math.max(0, Math.min(100, base + rain * profile.floodRisk)).toFixed(1));
        alert = readings.waterLevel > 30;
        alertMessage = readings.waterLevel > 50 ? 'CRITICAL: Flood level dangerously high!' : alert ? 'WARNING: Flood level elevated' : '';
      } else if (sensor.type === 'Road Sensor') {
        const base = readings.vibration || 1;
        const mult = isRushHour() ? rand(2, 3) : rand(1, 1.5);
        readings.vibration = parseFloat(Math.max(0, Math.min(10, base + rand(0, 0.2) * mult + rand(-0.3, 0.3))).toFixed(2));
        alert = readings.vibration > 5;
        alertMessage = alert ? 'WARNING: High road vibration - Pothole risk detected' : '';
      } else if (sensor.type === 'Traffic Camera') {
        readings.trafficFlow = Math.round(isRushHour() ? rand(1200, 2000) : rand(200, 800));
        alert = readings.trafficFlow > 1500;
        alertMessage = alert ? 'WARNING: Heavy traffic congestion detected' : '';
      } else if (sensor.type === 'Weather Station') {
        const h = new Date().getHours();
        readings.temperature = parseFloat((profile.baseTemp + Math.sin((h - 6) * Math.PI / 12) * 4 + rand(-1, 1)).toFixed(1));
        readings.humidity = parseFloat((profile.baseHumidity + rand(-5, 5)).toFixed(1));
        readings.airQuality = Math.round(rand(50, 180));
        alert = readings.airQuality > 150;
        alertMessage = alert ? 'WARNING: Poor air quality detected' : '';
      }

      // Auto-create incident on new critical alert
      if (alert && !sensor.alert && Math.random() < 0.15) {
        const typeMap = { 'Flood Sensor': 'Flood', 'Road Sensor': 'Pothole', 'Traffic Camera': 'Traffic', 'Weather Station': 'Accident' };
        try {
          const incident = await db.incidents.insert({
            incidentId: 'INC' + Date.now() + Math.round(Math.random() * 1000),
            type: typeMap[sensor.type] || 'Other',
            severity: readings.waterLevel > 50 ? 'Critical' : 'High',
            location: sensor.location,
            district: sensor.district,
            address: `Auto-detected near sensor ${sensor.sensorId}`,
            reportedBy: 'IoT-System',
            status: 'New',
            reportedAt: new Date().toISOString()
          });
          newAlerts.push({ type: 'new-incident', district: sensor.district, data: incident });
        } catch (e) { /* skip duplicate */ }
      }

      await db.sensors.update({ _id: sensor._id }, { $set: { readings, alert, alertMessage, timestamp: new Date().toISOString() } }, {});

      if (alert) {
        newAlerts.push({
          type: 'sensor-alert',
          district: sensor.district,
          data: { sensorId: sensor.sensorId, type: sensor.type, district: sensor.district, readings, alertMessage, location: sensor.location }
        });
      }
    }

    if (io) {
      newAlerts.forEach(a => {
        io.to(a.district).emit(a.type, a.data);
        io.emit('admin-' + a.type, a.data);
      });
      const updated = await db.sensors.find({});
      io.emit('sensors-update', updated);
    }
  } catch (err) {
    console.error('IoT Simulator error:', err.message);
  }
}

function startIoTSimulator(socketIo) {
  io = socketIo;
  console.log('🌡️  IoT Simulator started');
  simulationInterval = setInterval(updateSensors, 3000);
}

function stopIoTSimulator() {
  if (simulationInterval) clearInterval(simulationInterval);
}

module.exports = { startIoTSimulator, stopIoTSimulator };
