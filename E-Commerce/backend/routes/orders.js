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

const requireLogin = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'Please login first' });
    }
    next();
};

// Create order from cart with validation
router.post('/create', requireLogin, [
    body('shipping_address').trim().notEmpty().withMessage('Shipping address required'),
    body('payment_method').trim().notEmpty().withMessage('Payment method required'),
], validate, async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const { shipping_address, payment_method } = req.body;

        // Get cart items
        const [cartItems] = await connection.execute(`
            SELECT c.*, p.price, p.stock_quantity, p.name
            FROM cart c 
            JOIN products p ON c.product_id = p.id 
            WHERE c.user_id = ?
        `, [req.session.userId]);

        if (cartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Check stock for all items
        for (const item of cartItems) {
            if (item.stock_quantity < item.quantity) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${item.name}. Available: ${item.stock_quantity}`
                });
            }
        }

        // Calculate total
        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Create order
        const [orderResult] = await connection.execute(
            'INSERT INTO orders (user_id, total_amount, shipping_address, payment_method, status) VALUES (?, ?, ?, ?, ?)',
            [req.session.userId, total, shipping_address, payment_method, 'pending']
        );

        // Create order items and update stock
        for (const item of cartItems) {
            await connection.execute(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderResult.insertId, item.product_id, item.quantity, item.price]
            );

            // Update stock
            await connection.execute(
                'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        // Clear cart
        await connection.execute('DELETE FROM cart WHERE user_id = ?', [req.session.userId]);

        await connection.commit();

        res.json({
            success: true,
            message: 'Order placed successfully',
            orderId: orderResult.insertId
        });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: 'Error creating order' });
    } finally {
        connection.release();
    }
});

// Get user orders
router.get('/my-orders', requireLogin, async (req, res) => {
    try {
        const [orders] = await db.execute(`
            SELECT o.*, 
            (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
            FROM orders o
            WHERE o.user_id = ? 
            ORDER BY o.order_date DESC
        `, [req.session.userId]);

        res.json({ success: true, orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching orders' });
    }
});

// Get order details
router.get('/:orderId', requireLogin, async (req, res) => {
    try {
        const orderId = parseInt(req.params.orderId);

        if (isNaN(orderId)) {
            return res.status(400).json({ success: false, message: 'Invalid order ID' });
        }

        const [orders] = await db.execute(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [orderId, req.session.userId]
        );

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const [items] = await db.execute(`
            SELECT oi.*, p.name, p.image_url 
            FROM order_items oi 
            JOIN products p ON oi.product_id = p.id 
            WHERE oi.order_id = ?
        `, [orderId]);

        res.json({
            success: true,
            order: orders[0],
            items: items
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching order' });
    }
});

// Cancel order (only pending orders can be cancelled)
router.put('/cancel/:orderId', requireLogin, async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const orderId = parseInt(req.params.orderId);

        if (isNaN(orderId)) {
            return res.status(400).json({ success: false, message: 'Invalid order ID' });
        }

        // Check if order belongs to user and is pending
        const [orders] = await connection.execute(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [orderId, req.session.userId]
        );

        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (orders[0].status !== 'pending') {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Only pending orders can be cancelled' });
        }

        // Restore stock
        const [orderItems] = await connection.execute(
            'SELECT * FROM order_items WHERE order_id = ?',
            [orderId]
        );

        for (const item of orderItems) {
            await connection.execute(
                'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        // Update order status
        await connection.execute(
            'UPDATE orders SET status = ? WHERE id = ?',
            ['cancelled', orderId]
        );

        await connection.commit();

        res.json({ success: true, message: 'Order cancelled successfully' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: 'Error cancelling order' });
    } finally {
        connection.release();
    }
});

module.exports = router;
