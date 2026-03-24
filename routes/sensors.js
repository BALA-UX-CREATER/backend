const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/sensors
router.get('/', async (req, res) => {
  try {
    const { district, type } = req.query;
    const filter = {};
    if (district) filter.district = district;
    if (type) filter.type = type;
    const sensors = await db.sensors.find(filter);
    sensors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json({ success: true, data: sensors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/sensors/alerts/active
router.get('/alerts/active', async (req, res) => {
  try {
    const { district } = req.query;
    const filter = { alert: true };
    if (district) filter.district = district;
    let alerts = await db.sensors.find(filter);
    alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json({ success: true, data: alerts.slice(0, 20) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/sensors/type/flood
router.get('/type/flood', async (req, res) => {
  try {
    const sensors = await db.sensors.find({ type: 'Flood Sensor' });
    sensors.sort((a, b) => (b.readings.waterLevel || 0) - (a.readings.waterLevel || 0));
    res.json({ success: true, data: sensors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/sensors/type/road
router.get('/type/road', async (req, res) => {
  try {
    const sensors = await db.sensors.find({ type: 'Road Sensor' });
    sensors.sort((a, b) => (b.readings.vibration || 0) - (a.readings.vibration || 0));
    res.json({ success: true, data: sensors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/sensors/:district
router.get('/:district', async (req, res) => {
  try {
    const sensors = await db.sensors.find({ district: req.params.district });
    res.json({ success: true, data: sensors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
