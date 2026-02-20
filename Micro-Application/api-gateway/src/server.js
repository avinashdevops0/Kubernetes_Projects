require('dotenv').config();
const express = require('express');
const proxy = require('express-http-proxy');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.use((req, res, next) => {
  console.log(`[API Gateway] ${req.method} ${req.url}`);
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    services: {
      user: USER_SERVICE_URL,
      product: PRODUCT_SERVICE_URL,
      order: ORDER_SERVICE_URL
    }
  });
});

app.use('/users', proxy(USER_SERVICE_URL, {
  proxyReqPathResolver: (req) => `/users${req.url}`,
  proxyErrorHandler: (err, res, next) => {
    console.error('Proxy error:', err.message);
    res.status(503).json({ error: 'User service unavailable' });
  }
}));

app.use('/products', proxy(PRODUCT_SERVICE_URL, {
  proxyReqPathResolver: (req) => `/products${req.url}`,
  proxyErrorHandler: (err, res, next) => {
    console.error('Proxy error:', err.message);
    res.status(503).json({ error: 'Product service unavailable' });
  }
}));

app.use('/orders', proxy(ORDER_SERVICE_URL, {
  proxyReqPathResolver: (req) => `/orders${req.url}`,
  proxyErrorHandler: (err, res, next) => {
    console.error('Proxy error:', err.message);
    res.status(503).json({ error: 'Order service unavailable' });
  }
}));

app.get('/', (req, res) => {
  res.json({
    name: 'Microservices API Gateway',
    version: '1.0.0',
    endpoints: {
      users: '/users',
      products: '/products',
      orders: '/orders',
      health: '/health'
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});