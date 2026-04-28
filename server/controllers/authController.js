/**
 * Authentication Controller
 * 
 * Handles user registration, login, and profile retrieval.
 * Uses bcrypt for password hashing and JWT for session tokens.
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { isValidEmail } = require('../utils/helpers');

const JWT_SECRET = process.env.JWT_SECRET || 'concert_booking_secret';
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '24h';

/**
 * POST /api/auth/register
 * Register a new user account
 */
async function register(req, res) {
  try {
    const { name, email, password, phone } = req.body;

    // --- Input validation ---
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // --- Check for existing user ---
    const [existing] = await pool.execute(
      'SELECT user_id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // --- Hash password and create user ---
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
      [name.trim(), email.toLowerCase(), hashedPassword, phone || null]
    );

    // --- Generate JWT token ---
    const token = jwt.sign(
      { user_id: result.insertId, name: name.trim(), email: email.toLowerCase() },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: {
        user_id: result.insertId,
        name: name.trim(),
        email: email.toLowerCase()
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // --- Input validation ---
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // --- Find user ---
    const [users] = await pool.execute(
      'SELECT user_id, name, email, password FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];

    // --- Verify password ---
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // --- Generate JWT token ---
    const token = jwt.sign(
      { user_id: user.user_id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}

/**
 * GET /api/auth/me
 * Get current authenticated user's profile
 */
async function getProfile(req, res) {
  try {
    const [users] = await pool.execute(
      'SELECT user_id, name, email, phone, created_at FROM users WHERE user_id = ?',
      [req.user.user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
}

module.exports = { register, login, getProfile };
