const express = require('express');
const { query, validationResult } = require('express-validator');
const db = require('../database/config');
const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errors.array()
        });
    }
    next();
};

// Get all products with pagination and search
router.get('/', [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    query('search').optional().trim().escape().withMessage('Invalid search term'),
], validate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let queryStr = `
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM products p';
        let params = [];

        if (search) {
            queryStr += ' WHERE p.name LIKE ? OR p.description LIKE ?';
            countQuery += ' WHERE p.name LIKE ? OR p.description LIKE ?';
            params = [`%${search}%`, `%${search}%`];
        }

        queryStr += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';

        const [products] = await db.execute(queryStr, [...params, limit, offset]);
        const [countResult] = await db.execute(countQuery, params);
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            products,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasMore: page < totalPages
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching products' });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        
        if (isNaN(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        const [products] = await db.execute(
            'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?',
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, product: products[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching product' });
    }
});

// Get products by category
router.get('/category/:categoryId', async (req, res) => {
    try {
        const categoryId = parseInt(req.params.categoryId);

        if (isNaN(categoryId)) {
            return res.status(400).json({ success: false, message: 'Invalid category ID' });
        }

        const [products] = await db.execute(
            'SELECT * FROM products WHERE category_id = ? AND stock_quantity > 0',
            [categoryId]
        );
        res.json({ success: true, products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching products' });
    }
});

// Get all categories
router.get('/categories/list', async (req, res) => {
    try {
        const [categories] = await db.execute('SELECT * FROM categories ORDER BY name');
        res.json({ success: true, categories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching categories' });
    }
});

// Get featured products
router.get('/featured/list', async (req, res) => {
    try {
        const [products] = await db.execute(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.stock_quantity > 0
            ORDER BY p.created_at DESC 
            LIMIT 8
        `);
        res.json({ success: true, products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching featured products' });
    }
});

module.exports = router;
