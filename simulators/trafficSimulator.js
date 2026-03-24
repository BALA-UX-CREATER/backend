const db = require('../db');

let io = null;
let simulationInterval = null;

function isRushHour() {
  const h = new Date().getHours();
  return (h >= 8 && h <= 10) || (h >= 17 && h <= 19);
}

async function updateTraffic() {
  try {
    const sensors = await db.sensors.find({ type: 'Traffic Camera' });
    const trafficData = [];

    for (const sensor of sensors) {
      const base = isRushHour() ? 1200 : 400;
      const flow = Math.round(base + (Math.random() - 0.5) * 400);
      const congestion = flow > 1500 ? 'Heavy' : flow > 900 ? 'Moderate' : 'Light';
      const alert = flow > 1500;

      await db.sensors.update(
        { _id: sensor._id },
        { $set: { 'readings.trafficFlow': flow, alert, timestamp: new Date().toISOString() } },
        {}
      );

      trafficData.push({ sensorId: sensor.sensorId, district: sensor.district, location: sensor.location, flow, congestion, alert });
    }

    if (io) io.emit('traffic-update', trafficData);
  } catch (err) {
    console.error('Traffic Simulator error:', err.message);
  }
}

function startTrafficSimulator(socketIo) {
  io = socketIo;
  console.log('🚦 Traffic Simulator started');
  simulationInterval = setInterval(updateTraffic, 4000);
}

function stopTrafficSimulator() {
  if (simulationInterval) clearInterval(simulationInterval);
}

module.exports = { startTrafficSimulator, stopTrafficSimulator };
