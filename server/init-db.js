/**
 * Database Initialization Script
 * 
 * This script connects to MySQL and runs the schema.sql to set up the database and tables.
 * It uses the credentials from the .env file.
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDb() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT) || 3306,
    multipleStatements: true // Required to run the full schema.sql
  };

  console.log('🚀 Starting Database Initialization...');
  console.log(`Connecting to MySQL as ${config.user}@${config.host}:${config.port}...`);

  let connection;
  try {
    // Connect without a database first to create it
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL server.');

    // Read schema.sql
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found at ${schemaPath}`);
    }
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📦 Running schema.sql...');
    await connection.query(schemaSql);
    console.log('✅ Database and tables created successfully!');
    
    console.log('\n🎉 Setup Complete!');
    console.log('You can now start the server with: npm start');
  } catch (error) {
    console.error('\n❌ Initialization failed:');
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   Access denied. Please check your DB_USER and DB_PASSWORD in .env');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Could not connect to MySQL. Is MySQL running?');
    } else {
      console.error('   Error:', error.message);
    }
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

initDb();
