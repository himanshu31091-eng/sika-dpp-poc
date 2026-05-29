require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'x-admin-user'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/admin', require('./routes/admin'));
app.use('/docs', require('./routes/public'));
app.use('/edms', require('./routes/edms'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sika_dpp')
  .then(() => {
    console.log('[DB] MongoDB connected');
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`\n[API] Server running at http://localhost:${PORT}`);
      console.log(`[API] Admin panel: http://localhost:3000/admin`);
      console.log(`[API] Public site: http://localhost:3000\n`);
    });
  })
  .catch(err => {
    console.error('[DB] Connection failed:', err.message);
    console.error('Make sure MongoDB is running: check Services or run "mongod"');
    process.exit(1);
  });

