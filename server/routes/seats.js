/** Seat Routes — /api/seats */
const express = require('express');
const router = express.Router();
const { getSeats, lockSeats, unlockSeats } = require('../controllers/seatController');
const { authMiddleware } = require('../middleware/auth');

router.get('/:concertId', getSeats);
router.post('/lock', authMiddleware, lockSeats);
router.post('/unlock', authMiddleware, unlockSeats);

module.exports = router;
