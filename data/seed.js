/**
 * seed.js — Populates NeDB with all initial data.
 * Run once: node data/seed.js
 * Safe to re-run (clears and re-seeds each time).
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Ensure db directory exists
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = require('../db');
const { DISTRICTS } = require('./districts');

const SENSOR_TYPES = ['Flood Sensor', 'Road Sensor', 'Traffic Camera', 'Weather Station'];

async function clearCollection(store) {
  const all = await store.find({});
  for (const doc of all) await store.remove({ _id: doc._id }, {});
}

async function seed() {
  console.log('🌱 Seeding database...\n');

  // ── Districts ──────────────────────────────────────────────────────────────
  await clearCollection(db.districts);
  for (const d of DISTRICTS) {
    await db.districts.insert({
      ...d,
      healthScore: Math.round(70 + Math.random() * 25),
      alertCount: Math.round(Math.random() * 5)
    });
  }
  console.log(`✅ ${DISTRICTS.length} Districts seeded`);

  // ── Users ──────────────────────────────────────────────────────────────────
  await clearCollection(db.users);
  const adminHash   = await bcrypt.hash('admin123', 10);
  const citizenHash = await bcrypt.hash('citizen123', 10);

  await db.users.insert({
    userId: 'ADMIN001', name: 'Admin User',
    email: 'admin@smartcity.gov', passwordHash: adminHash,
    role: 'admin', district: 'Chennai', phone: '9876543210',
    createdAt: new Date().toISOString(), notifications: []
  });
  await db.users.insert({
    userId: 'CIT001', name: 'Demo Citizen',
    email: 'citizen@smartcity.gov', passwordHash: citizenHash,
    role: 'citizen', district: 'Chennai', phone: '9876543211',
    createdAt: new Date().toISOString(), notifications: []
  });
  console.log('✅ Users seeded');
  console.log('   Admin:   admin@smartcity.gov   / admin123');
  console.log('   Citizen: citizen@smartcity.gov / citizen123');

  // ── Ambulances (2 per district) ────────────────────────────────────────────
  await clearCollection(db.ambulances);
  let ambCount = 0;
  for (const d of DISTRICTS) {
    for (let i = 1; i <= 2; i++) {
      await db.ambulances.insert({
        ambulanceId: `AMB-${d.code}-${i}`,
        vehicleNumber: `TN${d.code}${1000 + i}`,
        district: d.name,
        currentLocation: {
          lat: parseFloat((d.coordinates.lat + (Math.random() - 0.5) * 0.05).toFixed(6)),
          lng: parseFloat((d.coordinates.lng + (Math.random() - 0.5) * 0.05).toFixed(6))
        },
        status: Math.random() < 0.8 ? 'Available' : 'On Duty',
        destination: null,
        speed: Math.round(30 + Math.random() * 30),
        lastUpdate: new Date().toISOString(),
        driver: {
          name: `Driver ${d.code}-${i}`,
          phone: `98765${Math.round(10000 + Math.random() * 89999)}`
        }
      });
      ambCount++;
    }
  }
  console.log(`✅ ${ambCount} Ambulances seeded`);

  // ── IoT Sensors (4 per district) ───────────────────────────────────────────
  await clearCollection(db.sensors);
  let sensorCount = 0;
  for (const d of DISTRICTS) {
    for (const type of SENSOR_TYPES) {
      const shortType = type.replace(/ /g, '').substring(0, 3).toUpperCase();
      await db.sensors.insert({
        sensorId: `SEN-${d.code}-${shortType}`,
        type,
        district: d.name,
        location: {
          lat: parseFloat((d.coordinates.lat + (Math.random() - 0.5) * 0.1).toFixed(6)),
          lng: parseFloat((d.coordinates.lng + (Math.random() - 0.5) * 0.1).toFixed(6))
        },
        readings: {
          waterLevel:  parseFloat((Math.random() * 15).toFixed(1)),
          vibration:   parseFloat((Math.random() * 3).toFixed(2)),
          trafficFlow: Math.round(200 + Math.random() * 800),
          temperature: Math.round(26 + Math.random() * 8),
          humidity:    Math.round(55 + Math.random() * 30),
          airQuality:  Math.round(50 + Math.random() * 100)
        },
        alert: false,
        alertMessage: '',
        timestamp: new Date().toISOString()
      });
      sensorCount++;
    }
  }
  console.log(`✅ ${sensorCount} IoT Sensors seeded`);

  console.log('\n🎉 Database ready! Run: npm start\n');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
