const jwt = require('jsonwebtoken');
const db = require('../db');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.users.findOne({ _id: decoded.id });
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    const { passwordHash: _, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'dispatcher')) return next();
  return res.status(403).json({ success: false, message: 'Admin access required' });
};

module.exports = { protect, adminOnly };
