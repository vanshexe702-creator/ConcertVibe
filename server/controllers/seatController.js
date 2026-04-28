/**
 * Seat Controller
 * 
 * Manages seat layouts, status queries, and seat locking logic.
 * Implements temporary seat locking (5-minute timeout) to prevent double-booking.
 */

const { pool } = require('../config/db');
const { generateSeatLayout } = require('../utils/helpers');

// Lock timeout in minutes
const LOCK_TIMEOUT_MINUTES = 5;

/**
 * GET /api/seats/:concertId
 * Get all seats for a concert
 * If no seats exist yet, generate the default layout
 */
async function getSeats(req, res) {
  try {
    const { concertId } = req.params;

    // Verify concert exists
    const [concerts] = await pool.execute(
      'SELECT concert_id, total_seats FROM concerts WHERE concert_id = ?',
      [concertId]
    );
    if (concerts.length === 0) {
      return res.status(404).json({ error: 'Concert not found.' });
    }

    // Check if seats are already generated
    let [seats] = await pool.execute(
      'SELECT * FROM seats WHERE concert_id = ? ORDER BY seat_row, seat_number',
      [concertId]
    );

    // Auto-generate seats if none exist
    if (seats.length === 0) {
      const seatLayout = generateSeatLayout(parseInt(concertId));
      const values = seatLayout.map(s => [
        s.concert_id, s.seat_label, s.seat_row, s.seat_number, s.seat_type, s.status
      ]);

      // Batch insert all seats
      for (const val of values) {
        await pool.execute(
          'INSERT INTO seats (concert_id, seat_label, seat_row, seat_number, seat_type, status) VALUES (?, ?, ?, ?, ?, ?)',
          val
        );
      }

      // Re-fetch the seats
      [seats] = await pool.execute(
        'SELECT * FROM seats WHERE concert_id = ? ORDER BY seat_row, seat_number',
        [concertId]
      );
    }

    // Auto-unlock expired locks
    await pool.execute(
      `UPDATE seats SET status = 'available', locked_by = NULL, locked_at = NULL 
       WHERE concert_id = ? AND status = 'locked' 
       AND locked_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
      [concertId, LOCK_TIMEOUT_MINUTES]
    );

    // Re-fetch after unlock cleanup
    [seats] = await pool.execute(
      'SELECT seat_id, seat_label, seat_row, seat_number, seat_type, status FROM seats WHERE concert_id = ? ORDER BY seat_row, seat_number',
      [concertId]
    );

    res.json({ seats });
  } catch (error) {
    console.error('Get seats error:', error);
    res.status(500).json({ error: 'Failed to fetch seats.' });
  }
}

/**
 * POST /api/seats/lock
 * Temporarily lock selected seats for the current user
 * Body: { concertId, seatLabels: ["A1", "A2"] }
 */
async function lockSeats(req, res) {
  const connection = await pool.getConnection();
  try {
    const { concertId, seatLabels } = req.body;
    const userId = req.user.user_id;

    if (!concertId || !seatLabels || !Array.isArray(seatLabels) || seatLabels.length === 0) {
      return res.status(400).json({ error: 'Concert ID and seat labels are required.' });
    }

    if (seatLabels.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 seats can be selected at once.' });
    }

    await connection.beginTransaction();

    // First, unlock any previously locked seats by this user for this concert
    await connection.execute(
      `UPDATE seats SET status = 'available', locked_by = NULL, locked_at = NULL 
       WHERE concert_id = ? AND locked_by = ? AND status = 'locked'`,
      [concertId, userId]
    );

    // Check if all requested seats are available
    const placeholders = seatLabels.map(() => '?').join(',');
    const [existingSeats] = await connection.execute(
      `SELECT seat_label, status FROM seats 
       WHERE concert_id = ? AND seat_label IN (${placeholders})`,
      [concertId, ...seatLabels]
    );

    // Verify all seats exist
    if (existingSeats.length !== seatLabels.length) {
      await connection.rollback();
      return res.status(400).json({ error: 'Some selected seats do not exist.' });
    }

    // Check if any are not available
    const unavailable = existingSeats.filter(s => s.status !== 'available');
    if (unavailable.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        error: 'Some seats are no longer available.',
        unavailableSeats: unavailable.map(s => s.seat_label)
      });
    }

    // Lock the seats
    await connection.execute(
      `UPDATE seats SET status = 'locked', locked_by = ?, locked_at = NOW() 
       WHERE concert_id = ? AND seat_label IN (${placeholders}) AND status = 'available'`,
      [userId, concertId, ...seatLabels]
    );

    await connection.commit();

    res.json({
      message: 'Seats locked successfully.',
      lockedSeats: seatLabels,
      expiresIn: `${LOCK_TIMEOUT_MINUTES} minutes`
    });
  } catch (error) {
    await connection.rollback();
    console.error('Lock seats error:', error);
    res.status(500).json({ error: 'Failed to lock seats.' });
  } finally {
    connection.release();
  }
}

/**
 * POST /api/seats/unlock
 * Release locked seats for the current user
 * Body: { concertId }
 */
async function unlockSeats(req, res) {
  try {
    const { concertId } = req.body;
    const userId = req.user.user_id;

    await pool.execute(
      `UPDATE seats SET status = 'available', locked_by = NULL, locked_at = NULL 
       WHERE concert_id = ? AND locked_by = ? AND status = 'locked'`,
      [concertId, userId]
    );

    res.json({ message: 'Seats unlocked successfully.' });
  } catch (error) {
    console.error('Unlock seats error:', error);
    res.status(500).json({ error: 'Failed to unlock seats.' });
  }
}

module.exports = { getSeats, lockSeats, unlockSeats };
