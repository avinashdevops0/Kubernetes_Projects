const mysql = require('mysql2/promise');

let pool;

async function initializeDatabase() {
  pool = mysql.createPool({
    host: process.env.USER_DB_HOST || 'avinash.cmdigqa4cp2m.us-east-1.rds.amazonaws.com',
    port: process.env.USER_DB_PORT || 3306,
    user: process.env.USER_DB_USER || 'admin',
    password: process.env.USER_DB_PASSWORD || 'admin123',
    database: process.env.USER_DB_NAME || 'userdb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  console.log('User database pool created');
  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error('Database not initialized');
  }
  return pool;
}

module.exports = { initializeDatabase, getPool };
