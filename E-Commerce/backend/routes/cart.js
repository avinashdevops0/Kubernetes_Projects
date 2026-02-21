const express = require('express');
const { body, validationResult } = require('express-validator');
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

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'Please login first' });
    }
    next();
};

// Get user's cart
router.get('/', requireLogin, async (req, res) => {
    try {
        const [cartItems] = await db.execute(`
            SELECT c.*, p.name, p.price, p.image_url, p.stock_quantity
            FROM cart c 
            JOIN products p ON c.product_id = p.id 
            WHERE c.user_id = ?
        `, [req.session.userId]);

        // Calculate totals
        const items = cartItems.map(item => ({
            ...item,
            available: item.stock_quantity > 0
        }));

        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        res.json({
            success: true,
            cart: items,
            subtotal,
            itemCount: items.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching cart' });
    }
});

// Add to cart with validation
router.post('/add', requireLogin, [
    body('product_id').isInt({ min: 1 }).withMessage('Valid product ID required'),
    body('quantity').isInt({ min: 1, max: 99 }).withMessage('Quantity must be 1-99'),
], validate, async (req, res) => {
    try {
        const { product_id, quantity } = req.body;

        // Check if product exists and has sufficient stock
        const [products] = await db.execute('SELECT * FROM products WHERE id = ?', [product_id]);

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const product = products[0];

        if (product.stock_quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock_quantity} items available in stock`
            });
        }

        // Check if item already in cart
        const [existing] = await db.execute(
            'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
            [req.session.userId, product_id]
        );

        if (existing.length > 0) {
            const newQuantity = existing[0].quantity + quantity;

            if (product.stock_quantity < newQuantity) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot add more. Only ${product.stock_quantity} items available`
                });
            }

            // Update quantity
            await db.execute(
                'UPDATE cart SET quantity = ? WHERE id = ?',
                [newQuantity, existing[0].id]
            );
        } else {
            // Add new item
            await db.execute(
                'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [req.session.userId, product_id, quantity]
            );
        }

        res.json({ success: true, message: 'Item added to cart' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error adding to cart' });
    }
});

// Update cart item quantity
router.put('/update/:cartId', requireLogin, [
    body('quantity').isInt({ min: 1, max: 99 }).withMessage('Quantity must be 1-99'),
], validate, async (req, res) => {
    try {
        const { quantity } = req.body;
        const cartId = parseInt(req.params.cartId);

        if (isNaN(cartId)) {
            return res.status(400).json({ success: false, message: 'Invalid cart ID' });
        }

        // Check if cart item belongs to user
        const [cartItems] = await db.execute(
            'SELECT c.*, p.stock_quantity FROM cart c JOIN products p ON c.product_id = p.id WHERE c.id = ? AND c.user_id = ?',
            [cartId, req.session.userId]
        );

        if (cartItems.length === 0) {
            return res.status(404).json({ success: false, message: 'Cart item not found' });
        }

        if (cartItems[0].stock_quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${cartItems[0].stock_quantity} items available`
            });
        }

        await db.execute(
            'UPDATE cart SET quantity = ? WHERE id = ?',
            [quantity, cartId]
        );

        res.json({ success: true, message: 'Cart updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error updating cart' });
    }
});

// Remove from cart
router.delete('/remove/:cartId', requireLogin, async (req, res) => {
    try {
        const cartId = parseInt(req.params.cartId);

        if (isNaN(cartId)) {
            return res.status(400).json({ success: false, message: 'Invalid cart ID' });
        }

        const [result] = await db.execute(
            'DELETE FROM cart WHERE id = ? AND user_id = ?',
            [cartId, req.session.userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Cart item not found' });
        }

        res.json({ success: true, message: 'Item removed from cart' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error removing from cart' });
    }
});

// Clear cart
router.delete('/clear', requireLogin, async (req, res) => {
    try {
        await db.execute('DELETE FROM cart WHERE user_id = ?', [req.session.userId]);
        res.json({ success: true, message: 'Cart cleared' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error clearing cart' });
    }
});

module.exports = router;
