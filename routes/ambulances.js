const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/ambulances
router.get('/', async (req, res) => {
  try {
    const { district, status } = req.query;
    const filter = {};
    if (district) filter.district = district;
    if (status) filter.status = status;
    const ambulances = await db.ambulances.find(filter);
    res.json({ success: true, data: ambulances });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/ambulances/nearby
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const ambulances = await db.ambulances.find({ status: 'Available' });
    const sorted = ambulances.sort((a, b) => {
      const da = Math.sqrt(Math.pow(a.currentLocation.lat - parseFloat(lat), 2) + Math.pow(a.currentLocation.lng - parseFloat(lng), 2));
      const db2 = Math.sqrt(Math.pow(b.currentLocation.lat - parseFloat(lat), 2) + Math.pow(b.currentLocation.lng - parseFloat(lng), 2));
      return da - db2;
    }).slice(0, 5);
    res.json({ success: true, data: sorted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/ambulances/dispatch
router.post('/dispatch', protect, async (req, res) => {
  try {
    const { ambulanceId, destination, incidentId } = req.body;
    await db.ambulances.update({ ambulanceId }, { $set: { status: 'On Duty', destination, lastUpdate: new Date().toISOString() } }, {});
    const ambulance = await db.ambulances.findOne({ ambulanceId });
    if (!ambulance) return res.status(404).json({ success: false, message: 'Ambulance not found' });
    const io = req.app.get('io');
    if (io) io.emit('ambulance-dispatched', { ambulance, incidentId });
    res.json({ success: true, data: ambulance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/ambulances/:ambulanceId
router.get('/:ambulanceId', async (req, res) => {
  try {
    const ambulance = await db.ambulances.findOne({ ambulanceId: req.params.ambulanceId });
    if (!ambulance) return res.status(404).json({ success: false, message: 'Ambulance not found' });
    res.json({ success: true, data: ambulance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/ambulances/:ambulanceId
router.put('/:ambulanceId', protect, adminOnly, async (req, res) => {
  try {
    const update = { ...req.body, lastUpdate: new Date().toISOString() };
    await db.ambulances.update({ ambulanceId: req.params.ambulanceId }, { $set: update }, {});
    const ambulance = await db.ambulances.findOne({ ambulanceId: req.params.ambulanceId });
    if (!ambulance) return res.status(404).json({ success: false, message: 'Ambulance not found' });
    res.json({ success: true, data: ambulance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
