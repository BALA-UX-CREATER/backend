const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { protect } = require('../middleware/auth');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, district, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    const existing = await db.users.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = 'CIT' + Date.now();
    const user = await db.users.insert({
      userId, name, email, passwordHash,
      role: 'citizen', district: district || 'Chennai',
      phone: phone || '', createdAt: new Date().toISOString(), notifications: []
    });
    const token = signToken(user._id);
    res.status(201).json({
      success: true, token,
      user: { id: user._id, userId: user.userId, name: user.name, email: user.email, role: user.role, district: user.district }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await db.users.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    const token = signToken(user._id);
    res.json({
      success: true, token,
      user: { id: user._id, userId: user.userId, name: user.name, email: user.email, role: user.role, district: user.district }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// POST /api/auth/logout
router.post('/logout', protect, (_req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

// PUT /api/auth/district
router.put('/district', protect, async (req, res) => {
  try {
    const { district } = req.body;
    if (!district) return res.status(400).json({ success: false, message: 'District required' });
    await db.users.update({ _id: req.user._id }, { $set: { district } }, {});
    res.json({ success: true, message: 'District updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
