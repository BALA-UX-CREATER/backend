const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/users (admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { role, district, limit = 50 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (district) filter.district = district;
    let users = await db.users.find(filter);
    users = users.map(({ passwordHash: _, ...u }) => u);
    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: users.slice(0, parseInt(limit)), count: users.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/:userId
router.get('/:userId', protect, adminOnly, async (req, res) => {
  try {
    const user = await db.users.findOne({ userId: req.params.userId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { passwordHash: _, ...safeUser } = user;
    res.json({ success: true, data: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/users/:userId
router.put('/:userId', protect, adminOnly, async (req, res) => {
  try {
    const { name, district, role, phone } = req.body;
    await db.users.update({ userId: req.params.userId }, { $set: { name, district, role, phone } }, {});
    const user = await db.users.findOne({ userId: req.params.userId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { passwordHash: _, ...safeUser } = user;
    res.json({ success: true, data: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/users/:userId
router.delete('/:userId', protect, adminOnly, async (req, res) => {
  try {
    await db.users.remove({ userId: req.params.userId }, {});
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
