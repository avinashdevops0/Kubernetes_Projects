require('dotenv').config();
const express = require('express');
const cors = require('cors');
const orderRoutes = require('./routes/orders');
const { initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[Order Service] ${req.method} ${req.url}`);
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'order-service',
    timestamp: new Date().toISOString()
  });
});

app.use('/orders', orderRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Order service running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });