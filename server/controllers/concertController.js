/**
 * Concert Controller
 * 
 * Handles listing, searching, filtering, and retrieving concert details.
 * Supports query params for search, city, category, and date filtering.
 */

const { pool } = require('../config/db');

/**
 * GET /api/concerts
 * List all upcoming concerts with optional search/filter
 * 
 * Query params:
 *   - search: search by title or artist name
 *   - city: filter by city
 *   - category: filter by category
 *   - date: filter by specific date
 *   - sort: 'date_asc', 'date_desc', 'price_asc', 'price_desc'
 */
async function listConcerts(req, res) {
  try {
    const { search, city, category, date, sort } = req.query;

    let query = `SELECT * FROM concerts WHERE status = 'upcoming' AND date >= CURDATE()`;
    const params = [];

    // Search by title or artist
    if (search) {
      query += ` AND (title LIKE ? OR artist LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Filter by city
    if (city) {
      query += ` AND city = ?`;
      params.push(city);
    }

    // Filter by category
    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    // Filter by date
    if (date) {
      query += ` AND date = ?`;
      params.push(date);
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        query += ` ORDER BY price ASC`;
        break;
      case 'price_desc':
        query += ` ORDER BY price DESC`;
        break;
      case 'date_desc':
        query += ` ORDER BY date DESC`;
        break;
      default:
        query += ` ORDER BY date ASC`; // Default: soonest first
    }

    const [concerts] = await pool.execute(query, params);

    res.json({ concerts, total: concerts.length });
  } catch (error) {
    console.error('List concerts error:', error);
    res.status(500).json({ error: 'Failed to fetch concerts.' });
  }
}

/**
 * GET /api/concerts/:id
 * Get single concert details by ID
 */
async function getConcert(req, res) {
  try {
    const { id } = req.params;

    const [concerts] = await pool.execute(
      'SELECT * FROM concerts WHERE concert_id = ?',
      [id]
    );

    if (concerts.length === 0) {
      return res.status(404).json({ error: 'Concert not found.' });
    }

    res.json({ concert: concerts[0] });
  } catch (error) {
    console.error('Get concert error:', error);
    res.status(500).json({ error: 'Failed to fetch concert details.' });
  }
}

/**
 * GET /api/concerts/cities
 * Get list of all unique cities (for filter dropdown)
 */
async function getCities(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT DISTINCT city FROM concerts WHERE status = "upcoming" ORDER BY city'
    );
    res.json({ cities: rows.map(r => r.city) });
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({ error: 'Failed to fetch cities.' });
  }
}

/**
 * GET /api/concerts/categories
 * Get list of all unique categories (for filter dropdown)
 */
async function getCategories(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT DISTINCT category FROM concerts WHERE status = "upcoming" ORDER BY category'
    );
    res.json({ categories: rows.map(r => r.category) });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
}

module.exports = { listConcerts, getConcert, getCities, getCategories };
