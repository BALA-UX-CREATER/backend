require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Ensure data/db directory exists before loading db
const dbDir = path.join(__dirname, 'data/db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.set('io', io);

// API Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/districts',  require('./routes/districts'));
app.use('/api/incidents',  require('./routes/incidents'));
app.use('/api/ambulances', require('./routes/ambulances'));
app.use('/api/sensors',    require('./routes/sensors'));
app.use('/api/users',      require('./routes/users'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date(), uptime: process.uptime() }));

// Serve static frontends
app.use('/citizen', express.static(path.join(__dirname, '../citizen-app')));
app.use('/admin',   express.static(path.join(__dirname, '../admin-dashboard')));
app.get('/', (_req, res) => res.redirect('/admin'));
app.use('/api/*', (_req, res) => res.status(404).json({ success: false, message: 'API route not found' }));

// Socket.IO
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join-district', (district) => socket.join(district));
  socket.on('join-admin', () => socket.join('admin-room'));

  socket.on('sos-alert', (data) => {
    io.emit('sos-alert', { ...data, timestamp: new Date() });
    io.to(data.district).emit('district-alert', {
      type: 'SOS', message: `🆘 Emergency SOS from ${data.district}!`,
      location: data.location, timestamp: new Date()
    });
  });

  socket.on('citizen-report', (data) => {
    io.emit('admin-new-incident', data);
    if (data.district) io.to(data.district).emit('new-incident', data);
  });

  socket.on('disconnect', () => console.log(`🔌 Disconnected: ${socket.id}`));
});

// Start server (no DB connection needed — NeDB auto-loads)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`🏛️  Admin Dashboard : http://localhost:${PORT}/admin`);
  console.log(`📱 Citizen App     : http://localhost:${PORT}/citizen\n`);

  const { startIoTSimulator }       = require('./simulators/iotSimulator');
  const { startAmbulanceSimulator } = require('./simulators/ambulanceSimulator');
  const { startTrafficSimulator }   = require('./simulators/trafficSimulator');
  startIoTSimulator(io);
  startAmbulanceSimulator(io);
  startTrafficSimulator(io);
});
