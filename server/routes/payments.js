/** Payment Routes — /api/payments */
const express = require('express');
const router = express.Router();
const { processPayment } = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/auth');

router.post('/process', authMiddleware, processPayment);

module.exports = router;
