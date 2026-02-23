const mysql = require('mysql2/promise');

let pool;

async function initializeDatabase() {
  pool = mysql.createPool({
    host: process.env.ANNOUNCEMENT_DB_HOST || 'avinash.cmdigqa4cp2m.us-east-1.rds.amazonaws.com',
    port: process.env.ANNOUNCEMENT_DB_PORT || 3306,
    user: process.env.ANNOUNCEMENT_DB_USER || 'admin',
    password: process.env.ANNOUNCEMENT_DB_PASSWORD || 'admin123',
    database: process.env.ANNOUNCEMENT_DB_NAME || 'announcement_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  console.log('Announcement database pool created');
  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error('Database not initialized');
  }
  return pool;
}

module.exports = { initializeDatabase, getPool };

