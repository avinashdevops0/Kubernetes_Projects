const mysql = require('mysql2/promise');

let pool;

async function initializeDatabase() {
  pool = mysql.createPool({
    host: process.env.LEAVE_DB_HOST || 'avinash.cmdigqa4cp2m.us-east-1.rds.amazonaws.com',
    port: process.env.LEAVE_DB_PORT || 3306,
    user: process.env.LEAVE_DB_USER || 'admin',
    password: process.env.LEAVE_DB_PASSWORD || 'admin123',
    database: process.env.LEAVE_DB_NAME || 'leave_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // Test the database connection
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Successfully connected to leave database');
  } catch (err) {
    console.error('❌ Failed to connect to leave database:', err.message);
    throw err;
  }

  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error('Database not initialized');
  }
  return pool;
}

module.exports = { initializeDatabase, getPool };
