const mysql = require('mysql2/promise');

let pool;

async function initializeDatabase() {
  pool = mysql.createPool({
    host: process.env.PAYROLL_DB_HOST || 'avinash.cmdigqa4cp2m.us-east-1.rds.amazonaws.com',
    port: process.env.PAYROLL_DB_PORT || 3306,
    user: process.env.PAYROLL_DB_USER || 'admin',
    password: process.env.PAYROLL_DB_PASSWORD || 'admin123',
    database: process.env.PAYROLL_DB_NAME || 'payroll_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  console.log('Payroll database pool created');
  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error('Database not initialized');
  }
  return pool;
}

module.exports = { initializeDatabase, getPool };

