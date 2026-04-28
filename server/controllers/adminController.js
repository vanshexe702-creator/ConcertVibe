/**
 * Admin Controller
 * Handles admin authentication, concert CRUD, booking management,
 * seat management, and revenue dashboard statistics.
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { generateSeatLayout } = require('../utils/helpers');

const JWT_SECRET = process.env.JWT_SECRET || 'concert_booking_secret';
const SALT_ROUNDS = 10;

/** POST /api/admin/login */
async function adminLogin(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required.' });

    const [admins] = await pool.execute('SELECT * FROM admins WHERE username = ?', [username]);
    if (admins.length === 0) return res.status(401).json({ error: 'Invalid credentials.' });

    const admin = admins[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign(
      { admin_id: admin.admin_id, username: admin.username, role: admin.role, isAdmin: true },
      JWT_SECRET, { expiresIn: '12h' }
    );
    res.json({ message: 'Admin login successful!', token, admin: { admin_id: admin.admin_id, username: admin.username, role: admin.role } });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed.' });
  }
}

/** GET /api/admin/concerts — List all concerts (including past) */
async function listAllConcerts(req, res) {
  try {
    const [concerts] = await pool.execute('SELECT * FROM concerts ORDER BY date DESC');
    res.json({ concerts });
  } catch (error) {
    console.error('Admin list concerts error:', error);
    res.status(500).json({ error: 'Failed to fetch concerts.' });
  }
}

/** POST /api/admin/concerts — Add a new concert */
async function addConcert(req, res) {
  try {
    const { title, artist, venue, city, category, date, time, price, vip_price, total_seats, image_url, description } = req.body;
    if (!title || !artist || !venue || !city || !date || !time || !price || !total_seats) {
      return res.status(400).json({ error: 'All required fields must be provided.' });
    }

    const [result] = await pool.execute(
      `INSERT INTO concerts (title, artist, venue, city, category, date, time, price, vip_price, total_seats, available_seats, image_url, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, artist, venue, city, category || 'General', date, time, price, vip_price || null, total_seats, total_seats, image_url || null, description || null]
    );

    // Auto-generate seats for the new concert
    const concertId = result.insertId;
    const seatLayout = generateSeatLayout(concertId);
    for (const s of seatLayout) {
      await pool.execute(
        'INSERT INTO seats (concert_id, seat_label, seat_row, seat_number, seat_type, status) VALUES (?, ?, ?, ?, ?, ?)',
        [s.concert_id, s.seat_label, s.seat_row, s.seat_number, s.seat_type, s.status]
      );
    }

    res.status(201).json({ message: 'Concert added successfully!', concertId });
  } catch (error) {
    console.error('Add concert error:', error);
    res.status(500).json({ error: 'Failed to add concert.' });
  }
}

/** PUT /api/admin/concerts/:id — Update a concert */
async function updateConcert(req, res) {
  try {
    const { id } = req.params;
    const { title, artist, venue, city, category, date, time, price, vip_price, image_url, description, status } = req.body;

    await pool.execute(
      `UPDATE concerts SET title=?, artist=?, venue=?, city=?, category=?, date=?, time=?, price=?, vip_price=?, image_url=?, description=?, status=? WHERE concert_id=?`,
      [title, artist, venue, city, category, date, time, price, vip_price, image_url, description, status, id]
    );
    res.json({ message: 'Concert updated successfully!' });
  } catch (error) {
    console.error('Update concert error:', error);
    res.status(500).json({ error: 'Failed to update concert.' });
  }
}

/** DELETE /api/admin/concerts/:id — Delete a concert */
async function deleteConcert(req, res) {
  try {
    const { id } = req.params;
    // Check for existing bookings
    const [bookings] = await pool.execute('SELECT COUNT(*) as count FROM bookings WHERE concert_id = ? AND booking_status = "confirmed"', [id]);
    if (bookings[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete concert with active bookings.' });
    }
    await pool.execute('DELETE FROM concerts WHERE concert_id = ?', [id]);
    res.json({ message: 'Concert deleted successfully!' });
  } catch (error) {
    console.error('Delete concert error:', error);
    res.status(500).json({ error: 'Failed to delete concert.' });
  }
}

/** GET /api/admin/bookings — All bookings */
async function getAllBookings(req, res) {
  try {
    const [bookings] = await pool.execute(
      `SELECT b.*, c.title, c.artist, c.venue, c.date, u.name as user_name, u.email as user_email
       FROM bookings b JOIN concerts c ON b.concert_id = c.concert_id JOIN users u ON b.user_id = u.user_id
       ORDER BY b.booking_date DESC`
    );
    res.json({ bookings });
  } catch (error) {
    console.error('Admin bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
}

/** GET /api/admin/dashboard — Revenue and stats */
async function getDashboard(req, res) {
  try {
    const [revenue] = await pool.execute(
      `SELECT COALESCE(SUM(total_amount), 0) as total_revenue, COUNT(*) as total_bookings, COALESCE(SUM(seat_count), 0) as total_tickets FROM bookings WHERE payment_status = 'completed'`
    );
    const [users] = await pool.execute('SELECT COUNT(*) as total_users FROM users');
    const [concerts] = await pool.execute('SELECT COUNT(*) as total_concerts FROM concerts');
    const [popular] = await pool.execute(
      `SELECT c.title, c.artist, COUNT(b.booking_id) as booking_count, SUM(b.total_amount) as revenue
       FROM concerts c LEFT JOIN bookings b ON c.concert_id = b.concert_id AND b.payment_status = 'completed'
       GROUP BY c.concert_id ORDER BY booking_count DESC LIMIT 5`
    );
    const [monthly] = await pool.execute(
      `SELECT DATE_FORMAT(booking_date, '%Y-%m') as month, SUM(total_amount) as revenue, COUNT(*) as bookings
       FROM bookings WHERE payment_status = 'completed' GROUP BY month ORDER BY month DESC LIMIT 6`
    );

    res.json({
      stats: {
        totalRevenue: revenue[0].total_revenue,
        totalBookings: revenue[0].total_bookings,
        totalTickets: revenue[0].total_tickets,
        totalUsers: users[0].total_users,
        totalConcerts: concerts[0].total_concerts
      },
      popularConcerts: popular,
      monthlyRevenue: monthly
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data.' });
  }
}

/** POST /api/admin/seats/block — Block/unblock seats */
async function manageSeatStatus(req, res) {
  try {
    const { concertId, seatLabels, action } = req.body;
    if (!concertId || !seatLabels || !action) return res.status(400).json({ error: 'Missing required fields.' });

    const ph = seatLabels.map(() => '?').join(',');
    if (action === 'block') {
      await pool.execute(`UPDATE seats SET status = 'blocked', seat_type = 'blocked' WHERE concert_id = ? AND seat_label IN (${ph}) AND status = 'available'`, [concertId, ...seatLabels]);
      await pool.execute('UPDATE concerts SET available_seats = available_seats - ? WHERE concert_id = ?', [seatLabels.length, concertId]);
    } else if (action === 'unblock') {
      await pool.execute(`UPDATE seats SET status = 'available', seat_type = 'regular' WHERE concert_id = ? AND seat_label IN (${ph}) AND status = 'blocked'`, [concertId, ...seatLabels]);
      await pool.execute('UPDATE concerts SET available_seats = available_seats + ? WHERE concert_id = ?', [seatLabels.length, concertId]);
    }
    res.json({ message: `Seats ${action}ed successfully!` });
  } catch (error) {
    console.error('Seat management error:', error);
    res.status(500).json({ error: 'Failed to manage seats.' });
  }
}

module.exports = { adminLogin, listAllConcerts, addConcert, updateConcert, deleteConcert, getAllBookings, getDashboard, manageSeatStatus };
