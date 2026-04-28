/**
 * Database Configuration
 * MySQL connection pool using mysql2/promise
 * 
 * Uses environment variables for connection parameters.
 * Connection pooling ensures efficient database access under load.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST || 'localhost',
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'concert_booking',
  port:     parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

/**
 * Test the database connection on startup
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    console.error('   Make sure MySQL is running and the database "concert_booking" exists.');
    console.error('   Run the schema.sql file first: mysql -u root -p < database/schema.sql');
    return false;
  }
}

module.exports = { pool, testConnection };
