const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');

dotenv.config();

const app = express();

// Security middleware - Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// Rate limiting - prevent brute force attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Too many login attempts, please try again later.'
    }
});

// Logging in development
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// Compression - reduce response size
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'strict'
    }
}));

// API Routes with auth rate limiting - MUST come before static file serving
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', authLimiter, require('./routes/cart'));
app.use('/api/orders', authLimiter, require('./routes/orders'));

// Root route - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Explicit routes for all HTML pages
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'login.html'));
});

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'register.html'));
});

app.get('/products.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'products.html'));
});

app.get('/cart.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'cart.html'));
});

// Serve static files from frontend - handles CSS, JS, images
app.use(express.static(path.join(__dirname, '../frontend')));

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: 'An internal server error occurred'
    });
});

// 404 handler - must be last
app.use((req, res) => {
    // Check if client expects HTML
    const accept = req.headers.accept || '';
    if (accept.includes('text/html')) {
        res.status(404).sendFile(path.join(__dirname, '../frontend', 'index.html'));
    } else {
        res.status(404).json({
            success: false,
            message: 'Route not found'
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
