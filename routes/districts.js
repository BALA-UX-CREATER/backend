const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/districts
router.get('/', async (req, res) => {
  try {
    const districts = await db.districts.find({});
    districts.sort((a, b) => a.name.localeCompare(b.name));
    res.json({ success: true, data: districts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/districts/:districtId
router.get('/:districtId', async (req, res) => {
  try {
    const district = await db.districts.findOne({ districtId: req.params.districtId });
    if (!district) return res.status(404).json({ success: false, message: 'District not found' });
    const incidents = await db.incidents.find({ district: district.name, status: { $ne: 'Resolved' } });
    const sensors = await db.sensors.find({ district: district.name });
    res.json({ success: true, data: { ...district, incidents: incidents.slice(0, 10), sensors } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/districts/:districtId/health
router.get('/:districtId/health', async (req, res) => {
  try {
    const district = await db.districts.findOne({ districtId: req.params.districtId });
    if (!district) return res.status(404).json({ success: false, message: 'District not found' });
    const activeIncidents = await db.incidents.find({ district: district.name, status: { $ne: 'Resolved' } });
    const criticalIncidents = activeIncidents.filter(i => i.severity === 'Critical');
    const healthScore = Math.max(0, 100 - (activeIncidents.length * 3) - (criticalIncidents.length * 10));
    await db.districts.update({ _id: district._id }, { $set: { healthScore, alertCount: activeIncidents.length } }, {});
    res.json({ success: true, data: { healthScore, activeIncidents: activeIncidents.length, criticalIncidents: criticalIncidents.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
