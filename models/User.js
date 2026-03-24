const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['citizen', 'admin', 'dispatcher'], default: 'citizen' },
  district: { type: String, default: 'Chennai' },
  location: { lat: { type: Number, default: 0 }, lng: { type: Number, default: 0 } },
  phone: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  notifications: [{
    message: String,
    type: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
});

userSchema.pre('save', async function(next) {
  if (!this.userId) {
    this.userId = 'USR' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  if (this.isModified('passwordHash')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
