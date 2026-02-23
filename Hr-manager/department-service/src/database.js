const mysql = require('mysql2/promise');

let pool;

async function initializeDatabase() {
  pool = mysql.createPool({
    host: process.env.DEPARTMENT_DB_HOST || 'avinash.cmdigqa4cp2m.us-east-1.rds.amazonaws.com',
    port: process.env.DEPARTMENT_DB_PORT || 3306,
    user: process.env.DEPARTMENT_DB_USER || 'admin',
    password: process.env.DEPARTMENT_DB_PASSWORD || 'admin123',
    database: process.env.DEPARTMENT_DB_NAME || 'department_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // Test the database connection
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Successfully connected to department database');
  } catch (err) {
    console.error('❌ Failed to connect to department database:', err.message);
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
