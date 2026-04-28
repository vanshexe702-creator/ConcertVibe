/** Booking Routes — /api/bookings */
const express = require('express');
const router = express.Router();
const { createBooking, getBookingHistory, getBooking, cancelBooking } = require('../controllers/bookingController');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, createBooking);
router.get('/history', authMiddleware, getBookingHistory);
router.get('/:id', authMiddleware, getBooking);
router.post('/:id/cancel', authMiddleware, cancelBooking);

module.exports = router;
