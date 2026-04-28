/**
 * Admin Authentication Middleware
 * 
 * Verifies JWT tokens specifically for admin users.
 * Admin tokens contain { admin_id, username, role, isAdmin: true }.
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'concert_booking_secret';

/**
 * Middleware: Require valid admin JWT token
 */
function adminAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Ensure the token belongs to an admin
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    req.admin = decoded; // { admin_id, username, role, isAdmin }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Admin token expired. Please login again.' });
    }
    return res.status(403).json({ error: 'Invalid admin token.' });
  }
}

module.exports = { adminAuthMiddleware };
