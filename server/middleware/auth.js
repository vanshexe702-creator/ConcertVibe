/**
 * JWT Authentication Middleware
 * 
 * Verifies the JSON Web Token from the Authorization header.
 * Attaches the decoded user object to req.user for downstream handlers.
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'concert_booking_secret';

/**
 * Middleware: Require valid JWT token
 * Usage: router.get('/protected', authMiddleware, handler)
 */
function authMiddleware(req, res, next) {
  // Extract token from "Bearer <token>" header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { user_id, name, email, iat, exp }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    return res.status(403).json({ error: 'Invalid token.' });
  }
}

/**
 * Middleware: Optionally attach user if token present (non-blocking)
 * Useful for public routes that show extra info for logged-in users
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (_) {
      req.user = null;
    }
  }
  next();
}

module.exports = { authMiddleware, optionalAuth };
