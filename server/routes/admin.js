/** Admin Routes — /api/admin */
const express = require('express');
const router = express.Router();
const { adminLogin, listAllConcerts, addConcert, updateConcert, deleteConcert, getAllBookings, getDashboard, manageSeatStatus } = require('../controllers/adminController');
const { adminAuthMiddleware } = require('../middleware/adminAuth');

// Public admin login
router.post('/login', adminLogin);

// Protected admin routes
router.get('/dashboard', adminAuthMiddleware, getDashboard);
router.get('/concerts', adminAuthMiddleware, listAllConcerts);
router.post('/concerts', adminAuthMiddleware, addConcert);
router.put('/concerts/:id', adminAuthMiddleware, updateConcert);
router.delete('/concerts/:id', adminAuthMiddleware, deleteConcert);
router.get('/bookings', adminAuthMiddleware, getAllBookings);
router.post('/seats/block', adminAuthMiddleware, manageSeatStatus);

module.exports = router;
