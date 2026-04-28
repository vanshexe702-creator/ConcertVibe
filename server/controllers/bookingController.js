/**
 * Booking Controller
 * Handles booking creation, history, detail, and cancellation.
 * All write operations use database transactions for atomicity.
 */

const { pool } = require('../config/db');
const { generateBookingId } = require('../utils/helpers');

/** POST /api/bookings — Create a new booking */
async function createBooking(req, res) {
  const connection = await pool.getConnection();
  try {
    const { concertId, seatLabels, paymentMethod, promoCode } = req.body;
    const userId = req.user.user_id;

    if (!concertId || !seatLabels || !Array.isArray(seatLabels) || seatLabels.length === 0) {
      return res.status(400).json({ error: 'Concert ID and seats are required.' });
    }
    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method is required.' });
    }

    await connection.beginTransaction();

    // Get concert
    const [concerts] = await connection.execute(
      'SELECT * FROM concerts WHERE concert_id = ? AND status = "upcoming"', [concertId]
    );
    if (concerts.length === 0) { await connection.rollback(); return res.status(404).json({ error: 'Concert not found.' }); }
    const concert = concerts[0];

    // Verify seats locked by user
    const ph = seatLabels.map(() => '?').join(',');
    const [lockedSeats] = await connection.execute(
      `SELECT seat_label, seat_type, status, locked_by FROM seats WHERE concert_id = ? AND seat_label IN (${ph})`,
      [concertId, ...seatLabels]
    );
    if (lockedSeats.length !== seatLabels.length) { await connection.rollback(); return res.status(400).json({ error: 'Some seats do not exist.' }); }
    const invalid = lockedSeats.filter(s => s.status !== 'locked' || s.locked_by !== userId);
    if (invalid.length > 0) { await connection.rollback(); return res.status(409).json({ error: 'Some seats are no longer locked by you.' }); }

    // Calculate amount
    let totalAmount = 0;
    for (const seat of lockedSeats) {
      totalAmount += (seat.seat_type === 'vip' && concert.vip_price) ? parseFloat(concert.vip_price) : parseFloat(concert.price);
    }

    // Apply promo code
    let discount = 0, appliedPromo = null;
    if (promoCode) {
      const [promos] = await connection.execute(
        `SELECT * FROM promo_codes WHERE code = ? AND is_active = 1 AND used_count < max_uses AND (valid_until IS NULL OR valid_until >= CURDATE())`,
        [promoCode.toUpperCase()]
      );
      if (promos.length > 0) {
        discount = totalAmount * (parseFloat(promos[0].discount_percent) / 100);
        appliedPromo = promos[0].code;
        await connection.execute('UPDATE promo_codes SET used_count = used_count + 1 WHERE promo_id = ?', [promos[0].promo_id]);
      }
    }

    const finalAmount = totalAmount - discount;
    const bookingId = generateBookingId();

    await connection.execute(
      `INSERT INTO bookings (booking_id, user_id, concert_id, seats, seat_count, total_amount, payment_method, payment_status, booking_status, promo_code, discount) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', 'confirmed', ?, ?)`,
      [bookingId, userId, concertId, JSON.stringify(seatLabels), seatLabels.length, finalAmount, paymentMethod, appliedPromo, discount]
    );
    await connection.execute(
      `UPDATE seats SET status = 'booked', locked_by = NULL, locked_at = NULL WHERE concert_id = ? AND seat_label IN (${ph})`,
      [concertId, ...seatLabels]
    );
    await connection.execute('UPDATE concerts SET available_seats = available_seats - ? WHERE concert_id = ?', [seatLabels.length, concertId]);

    await connection.commit();

    const [bookings] = await pool.execute(
      `SELECT b.*, c.title, c.artist, c.venue, c.city, c.date, c.time, c.image_url, u.name as user_name, u.email as user_email FROM bookings b JOIN concerts c ON b.concert_id = c.concert_id JOIN users u ON b.user_id = u.user_id WHERE b.booking_id = ?`,
      [bookingId]
    );

    res.status(201).json({ message: 'Booking confirmed!', booking: bookings[0] });
  } catch (error) {
    await connection.rollback();
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Booking failed. Please try again.' });
  } finally {
    connection.release();
  }
}

/** GET /api/bookings/history */
async function getBookingHistory(req, res) {
  try {
    const [bookings] = await pool.execute(
      `SELECT b.*, c.title, c.artist, c.venue, c.city, c.date, c.time, c.image_url FROM bookings b JOIN concerts c ON b.concert_id = c.concert_id WHERE b.user_id = ? ORDER BY b.booking_date DESC`,
      [req.user.user_id]
    );
    res.json({ bookings });
  } catch (error) {
    console.error('Booking history error:', error);
    res.status(500).json({ error: 'Failed to fetch booking history.' });
  }
}

/** GET /api/bookings/:id */
async function getBooking(req, res) {
  try {
    const [bookings] = await pool.execute(
      `SELECT b.*, c.title, c.artist, c.venue, c.city, c.date, c.time, c.image_url, u.name as user_name, u.email as user_email FROM bookings b JOIN concerts c ON b.concert_id = c.concert_id JOIN users u ON b.user_id = u.user_id WHERE b.booking_id = ? AND b.user_id = ?`,
      [req.params.id, req.user.user_id]
    );
    if (bookings.length === 0) return res.status(404).json({ error: 'Booking not found.' });
    res.json({ booking: bookings[0] });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Failed to fetch booking.' });
  }
}

/** POST /api/bookings/:id/cancel */
async function cancelBooking(req, res) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    await connection.beginTransaction();

    const [bookings] = await connection.execute(
      `SELECT b.*, c.date, c.time FROM bookings b JOIN concerts c ON b.concert_id = c.concert_id WHERE b.booking_id = ? AND b.user_id = ? AND b.booking_status = 'confirmed'`,
      [id, req.user.user_id]
    );
    if (bookings.length === 0) { await connection.rollback(); return res.status(404).json({ error: 'Active booking not found.' }); }

    const booking = bookings[0];
    const concertDate = new Date(`${booking.date.toISOString().split('T')[0]}T${booking.time}`);
    if ((concertDate - new Date()) / 3600000 < 24) {
      await connection.rollback();
      return res.status(400).json({ error: 'Cancellation not allowed within 24 hours of the concert.' });
    }

    const seats = JSON.parse(booking.seats);
    const ph = seats.map(() => '?').join(',');

    await connection.execute(`UPDATE bookings SET booking_status = 'cancelled', payment_status = 'refunded' WHERE booking_id = ?`, [id]);
    await connection.execute(`UPDATE seats SET status = 'available' WHERE concert_id = ? AND seat_label IN (${ph})`, [booking.concert_id, ...seats]);
    await connection.execute('UPDATE concerts SET available_seats = available_seats + ? WHERE concert_id = ?', [booking.seat_count, booking.concert_id]);

    await connection.commit();
    res.json({ message: 'Booking cancelled successfully. Refund will be processed.' });
  } catch (error) {
    await connection.rollback();
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Cancellation failed.' });
  } finally {
    connection.release();
  }
}

module.exports = { createBooking, getBookingHistory, getBooking, cancelBooking };
