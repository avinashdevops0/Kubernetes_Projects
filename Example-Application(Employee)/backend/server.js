const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Import routes
const employeeRoutes = require('./routes/employees');
const departmentRoutes = require('./routes/departments');

// Use routes
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date(),
        tiers: {
            frontend: 'Connected',
            backend: 'Running',
            database: 'Connected'
        },
        endpoints: {
            employees: '/api/employees',
            departments: '/api/departments'
        }
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Employee Management System API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            employees: '/api/employees',
            departments: '/api/departments'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════════╗
    ║   Employee Management System - Backend     ║
    ╠════════════════════════════════════════════╣
    ║  Tier 2: Application Layer (Node.js)       ║
    ║  Port: ${PORT}                              ║
    ║  API: http://localhost:${PORT}              ║
    ║  Health: http://localhost:${PORT}/health    ║
    ╚════════════════════════════════════════════╝
    `);
});