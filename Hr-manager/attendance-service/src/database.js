const mysql = require('mysql2/promise');

let pool;

async function initializeDatabase() {
  pool = mysql.createPool({
    host: process.env.ATTENDANCE_DB_HOST || 'avinash.cmdigqa4cp2m.us-east-1.rds.amazonaws.com',
    port: process.env.ATTENDANCE_DB_PORT || 3306,
    user: process.env.ATTENDANCE_DB_USER || 'admin',
    password: process.env.ATTENDANCE_DB_PASSWORD || 'admin123',
    database: process.env.ATTENDANCE_DB_NAME || 'attendance_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  console.log('Attendance database pool created');
  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error('Database not initialized');
  }
  return pool;
}

module.exports = { initializeDatabase, getPool };

