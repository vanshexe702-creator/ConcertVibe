/**
 * Utility Helpers
 * 
 * Common utility functions used across the application:
 * - ID generation
 * - Date formatting
 * - Input validation
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Generate a human-readable booking ID
 * Format: TKT-YYYYMMDD-XXXXX (random 5 chars)
 */
function generateBookingId() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = uuidv4().slice(0, 5).toUpperCase();
  return `TKT-${dateStr}-${randomPart}`;
}

/**
 * Generate seat layout for a concert
 * Creates rows A-J with seats 1-15 each (150 total seats)
 * First 2 rows (A-B) are VIP, rest are regular
 * 
 * @param {number} concertId - The concert to generate seats for
 * @returns {Array} Array of seat objects ready for DB insertion
 */
function generateSeatLayout(concertId) {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const seatsPerRow = 15;
  const vipRows = ['A', 'B']; // First 2 rows are VIP
  const seats = [];

  for (const row of rows) {
    for (let num = 1; num <= seatsPerRow; num++) {
      seats.push({
        concert_id: concertId,
        seat_label: `${row}${num}`,
        seat_row: row,
        seat_number: num,
        seat_type: vipRows.includes(row) ? 'vip' : 'regular',
        status: 'available'
      });
    }
  }

  return seats;
}

/**
 * Validate email format
 * @param {string} email 
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format date for display
 * @param {Date|string} date 
 * @returns {string}
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format currency
 * @param {number} amount 
 * @returns {string}
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

module.exports = {
  generateBookingId,
  generateSeatLayout,
  isValidEmail,
  formatDate,
  formatCurrency
};
