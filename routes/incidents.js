const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/incidents
router.get('/', async (req, res) => {
  try {
    const { district, type, status, severity, limit = 50 } = req.query;
    const filter = {};
    if (district) filter.district = district;
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    let incidents = await db.incidents.find(filter);
    incidents.sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));
    incidents = incidents.slice(0, parseInt(limit));
    res.json({ success: true, data: incidents, count: incidents.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/incidents/nearby
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    const incidents = await db.incidents.find({ status: { $ne: 'Resolved' } });
    const nearby = incidents.filter(inc => {
      const d = Math.sqrt(Math.pow(inc.location.lat - parseFloat(lat), 2) + Math.pow(inc.location.lng - parseFloat(lng), 2));
      return d < parseFloat(radius) * 0.01;
    });
    res.json({ success: true, data: nearby });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/incidents/district/:district
router.get('/district/:district', async (req, res) => {
  try {
    let incidents = await db.incidents.find({ district: req.params.district });
    incidents.sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));
    res.json({ success: true, data: incidents.slice(0, 30) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/incidents/:incidentId
router.get('/:incidentId', async (req, res) => {
  try {
    const incident = await db.incidents.findOne({ incidentId: req.params.incidentId });
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found' });
    res.json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/incidents
router.post('/', protect, async (req, res) => {
  try {
    const { type, severity, location, district, address, description, images } = req.body;
    const incident = await db.incidents.insert({
      incidentId: 'INC' + Date.now(),
      type, severity, location, district, address, description,
      images: images || [],
      reportedBy: req.user.userId,
      status: 'New',
      reportedAt: new Date().toISOString()
    });
    const io = req.app.get('io');
    if (io) {
      io.to(district).emit('new-incident', incident);
      io.emit('admin-new-incident', incident);
    }
    res.status(201).json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/incidents/:incidentId
router.put('/:incidentId', protect, adminOnly, async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.status === 'Resolved') update.resolvedAt = new Date().toISOString();
    await db.incidents.update({ incidentId: req.params.incidentId }, { $set: update }, {});
    const incident = await db.incidents.findOne({ incidentId: req.params.incidentId });
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found' });
    const io = req.app.get('io');
    if (io) io.emit('incident-updated', incident);
    res.json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
