/**
 * Concert Ticket Booking System — Server Entry Point
 * 
 * Express.js server with:
 * - Static file serving for the frontend
 * - REST API routes for auth, concerts, seats, bookings, payments, admin
 * - CORS enabled for development
 * - Error handling middleware
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const concertRoutes = require('./routes/concerts');
const seatRoutes = require('./routes/seats');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── API Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/concerts', concertRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// ─── Health Check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── SPA Fallback — Serve index.html for non-API routes ────
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  }
});

// ─── Global Error Handler ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Start Server ───────────────────────────────────────────
async function start() {
  const dbConnected = await testConnection();
  
  app.listen(PORT, () => {
    console.log(`\n🎵 Concert Ticket Booking System`);
    console.log(`   Server running at http://localhost:${PORT}`);
    console.log(`   Database: ${dbConnected ? '✅ Connected' : '❌ Not connected'}`);
    console.log(`   Admin panel: http://localhost:${PORT}/admin/login.html\n`);
  });
}

start();
