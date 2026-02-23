const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'hr-api-gateway',
    timestamp: new Date().toISOString()
  });
});

// Service URLs - using localhost for local development
const SERVICES = {
  employee: process.env.EMPLOYEE_SERVICE_URL || 'http://localhost:3001',
  department: process.env.DEPARTMENT_SERVICE_URL || 'http://localhost:3002',
  leave: process.env.LEAVE_SERVICE_URL || 'http://localhost:3003',
  review: process.env.REVIEW_SERVICE_URL || 'http://localhost:3004',
  attendance: process.env.ATTENDANCE_SERVICE_URL || 'http://localhost:3005',
  payroll: process.env.PAYROLL_SERVICE_URL || 'http://localhost:3006',
  announcement: process.env.ANNOUNCEMENT_SERVICE_URL || 'http://en-service'
};

// Proxy middleware factory
const createProxy = (target, serviceName) => createProxyMiddleware({
  target,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy:${serviceName}] ${req.method} ${req.url} -> ${target}${req.url}`);
  },
  onError: (err, req, res) => {
    console.error(`[Proxy Error] ${err.message}`);
    res.status(503).json({ error: 'Service unavailable', message: err.message });
  }
});

// Route to Employee Service
app.use('/employees', createProxy(SERVICES.employee, 'employee'));

// Route to Department Service
app.use('/departments', createProxy(SERVICES.department, 'department'));

// Route to Leave Service
app.use('/leaves', createProxy(SERVICES.leave, 'leave'));

// Route to Review Service
app.use('/reviews', createProxy(SERVICES.review, 'review'));

// Route to Attendance Service
app.use('/attendance', createProxy(SERVICES.attendance, 'attendance'));

// Route to Payroll Service
app.use('/payroll', createProxy(SERVICES.payroll, 'payroll'));

// Route to Announcement Service
app.use('/announcements', createProxy(SERVICES.announcement, 'announcement'));

// Service status endpoint
app.get('/services', (req, res) => {
  const serviceStatus = Object.entries(SERVICES).map(([name, url]) => ({
    name,
    url,
    status: 'configured'
  }));
  res.json({ gateway: 'HR API Gateway', services: serviceStatus });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`HR API Gateway running on port ${PORT}`);
  console.log('Available routes:');
  console.log('  - /employees    -> Employee Service');
  console.log('  - /departments  -> Department Service');
  console.log('  - /leaves       -> Leave Service');
  console.log('  - /reviews      -> Review Service');
  console.log('  - /attendance   -> Attendance Service');
  console.log('  - /payroll      -> Payroll Service');
  console.log('  - /announcements -> Announcement Service');
});
