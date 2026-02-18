
const mysql = require('mysql2');

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'avinash.cmdigqa4cp2m.us-east-1.rds.amazonaws.com',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'admin123',
    database: process.env.DB_NAME || 'employee_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

// Initialize database with tables and sample data
async function initDatabase() {
    try {
        console.log('📦 Connecting to database...');

        // Create departments table
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS departments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                location VARCHAR(100),
                budget DECIMAL(10,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Departments table ready');

        // Create employees table
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(20),
                position VARCHAR(100),
                department_id INT,
                salary DECIMAL(10,2),
                join_date DATE,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ Employees table ready');

        // Insert sample departments if none exist
        const [deptRows] = await promisePool.query('SELECT COUNT(*) as count FROM departments');
        if (deptRows[0].count === 0) {
            await promisePool.query(`
                INSERT INTO departments (name, location, budget) VALUES
                ('Engineering', 'New York', 500000),
                ('Marketing', 'San Francisco', 300000),
                ('Sales', 'Chicago', 400000),
                ('Human Resources', 'Boston', 200000),
                ('Finance', 'New York', 350000)
            `);
            console.log('✅ Sample departments inserted');
        }

        // Insert sample employees if none exist
        const [empRows] = await promisePool.query('SELECT COUNT(*) as count FROM employees');
        if (empRows[0].count === 0) {
            await promisePool.query(`
                INSERT INTO employees (name, email, phone, position, department_id, salary, join_date) VALUES
                ('John Doe', 'john@example.com', '555-0101', 'Senior Developer', 1, 85000, '2023-01-15'),
                ('Jane Smith', 'jane@example.com', '555-0102', 'Marketing Manager', 2, 75000, '2023-02-20'),
                ('Bob Johnson', 'bob@example.com', '555-0103', 'Sales Representative', 3, 65000, '2023-03-10'),
                ('Alice Brown', 'alice@example.com', '555-0104', 'HR Specialist', 4, 55000, '2023-04-05'),
                ('Charlie Wilson', 'charlie@example.com', '555-0105', 'Financial Analyst', 5, 70000, '2023-05-12')
            `);
            console.log('✅ Sample employees inserted');
        }

        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
    }
}

module.exports = { promisePool, initDatabase };