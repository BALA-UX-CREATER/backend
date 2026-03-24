const db = require('../db');

let io = null;
let simulationInterval = null;

function moveTowards(current, target, speed) {
  const dlat = target.lat - current.lat;
  const dlng = target.lng - current.lng;
  const dist = Math.sqrt(dlat * dlat + dlng * dlng);
  if (dist < 0.001) return { lat: target.lat, lng: target.lng, arrived: true };
  const step = Math.min(speed * 0.00001, dist);
  return {
    lat: parseFloat((current.lat + (dlat / dist) * step).toFixed(6)),
    lng: parseFloat((current.lng + (dlng / dist) * step).toFixed(6)),
    arrived: false
  };
}

function randomNearby(lat, lng, r = 0.05) {
  return { lat: lat + (Math.random() - 0.5) * r, lng: lng + (Math.random() - 0.5) * r };
}

async function updateAmbulances() {
  try {
    const ambulances = await db.ambulances.find({});

    for (const amb of ambulances) {
      let newLoc = { ...amb.currentLocation };
      let newStatus = amb.status;
      let newDest = amb.destination;

      if (amb.status === 'On Duty' && amb.destination && amb.destination.lat) {
        const moved = moveTowards(amb.currentLocation, amb.destination, amb.speed || 40);
        newLoc = { lat: moved.lat, lng: moved.lng };
        if (moved.arrived) { newStatus = 'Available'; newDest = null; }
      } else if (amb.status === 'Available') {
        newLoc = {
          lat: parseFloat((amb.currentLocation.lat + (Math.random() - 0.5) * 0.001).toFixed(6)),
          lng: parseFloat((amb.currentLocation.lng + (Math.random() - 0.5) * 0.001).toFixed(6))
        };
        if (Math.random() < 0.02) {
          newDest = randomNearby(amb.currentLocation.lat, amb.currentLocation.lng, 0.03);
          newStatus = 'On Duty';
        }
      }

      await db.ambulances.update(
        { _id: amb._id },
        { $set: { currentLocation: newLoc, status: newStatus, destination: newDest, lastUpdate: new Date().toISOString() } },
        {}
      );
    }

    if (io) {
      const updated = await db.ambulances.find({});
      io.emit('ambulance-update', updated);
    }
  } catch (err) {
    console.error('Ambulance Simulator error:', err.message);
  }
}

function startAmbulanceSimulator(socketIo) {
  io = socketIo;
  console.log('🚑 Ambulance Simulator started');
  simulationInterval = setInterval(updateAmbulances, 2000);
}

function stopAmbulanceSimulator() {
  if (simulationInterval) clearInterval(simulationInterval);
}

module.exports = { startAmbulanceSimulator, stopAmbulanceSimulator };
