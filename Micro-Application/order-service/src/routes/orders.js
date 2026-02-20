const express = require('express');
const Joi = require('joi');
const axios = require('axios');
const { getPool } = require('../database');

const router = express.Router();

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

const orderSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  productId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).required()
});

const updateOrderSchema = Joi.object({
  quantity: Joi.number().integer().min(1),
  status: Joi.string().valid('pending', 'processing', 'completed', 'cancelled')
}).min(1);

// Create a new order
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    let userResponse, productResponse;
    
    try {
      userResponse = await axios.get(`${USER_SERVICE_URL}/users/${value.userId}`);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return res.status(404).json({ error: 'User not found' });
      }
      throw new Error('User service unavailable');
    }

    try {
      productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/products/${value.productId}`);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return res.status(404).json({ error: 'Product not found' });
      }
      throw new Error('Product service unavailable');
    }

    const product = productResponse.data;
    const totalPrice = product.price * value.quantity;

    const pool = getPool();
    const [result] = await pool.execute(
      'INSERT INTO orders (user_id, product_id, quantity, total_price) VALUES (?, ?, ?, ?)',
      [value.userId, value.productId, value.quantity, totalPrice]
    );

    const [newOrder] = await pool.execute(
      'SELECT id, user_id, product_id, quantity, total_price, status, created_at FROM orders WHERE id = ?',
      [result.insertId]
    );

    const order = {
      ...newOrder[0],
      user: userResponse.data,
      product: product
    };

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error.message);
    next(error);
  }
});

// Get order by ID
router.get('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, user_id, product_id, quantity, total_price, status, created_at FROM orders WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = rows[0];

    try {
      const [userResponse, productResponse] = await Promise.all([
        axios.get(`${USER_SERVICE_URL}/users/${order.user_id}`),
        axios.get(`${PRODUCT_SERVICE_URL}/products/${order.product_id}`)
      ]);
      
      order.user = userResponse.data;
      order.product = productResponse.data;
    } catch (error) {
      console.error('Error fetching related data:', error.message);
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// Update order
router.put('/:id', async (req, res, next) => {
  try {
    const { error, value } = updateOrderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const pool = getPool();
    
    const [existing] = await pool.execute(
      'SELECT id, user_id, product_id, quantity, total_price FROM orders WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentOrder = existing[0];
    const updates = [];
    const values = [];

    // If quantity is being updated, recalculate total_price
    if (value.quantity && value.quantity !== currentOrder.quantity) {
      try {
        const productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/products/${currentOrder.product_id}`);
        const product = productResponse.data;
        const newTotalPrice = product.price * value.quantity;
        updates.push('quantity = ?', 'total_price = ?');
        values.push(value.quantity, newTotalPrice);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          return res.status(404).json({ error: 'Product not found' });
        }
        throw new Error('Product service unavailable');
      }
    }

    if (value.status) {
      updates.push('status = ?');
      values.push(value.status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.params.id);

    await pool.execute(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await pool.execute(
      'SELECT id, user_id, product_id, quantity, total_price, status, created_at FROM orders WHERE id = ?',
      [req.params.id]
    );

    const order = updated[0];

    // Enrich with user and product data
    try {
      const [userResponse, productResponse] = await Promise.all([
        axios.get(`${USER_SERVICE_URL}/users/${order.user_id}`),
        axios.get(`${PRODUCT_SERVICE_URL}/products/${order.product_id}`)
      ]);
      
      order.user = userResponse.data;
      order.product = productResponse.data;
    } catch (error) {
      console.error('Error fetching related data:', error.message);
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error.message);
    next(error);
  }
});

// Get all orders
router.get('/', async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, user_id, product_id, quantity, total_price, status, created_at FROM orders ORDER BY created_at DESC'
    );

    const enrichedOrders = await Promise.all(
      rows.map(async (order) => {
        try {
          const [userResponse, productResponse] = await Promise.all([
            axios.get(`${USER_SERVICE_URL}/users/${order.user_id}`),
            axios.get(`${PRODUCT_SERVICE_URL}/products/${order.product_id}`)
          ]);
          
          return {
            ...order,
            user: userResponse.data,
            product: productResponse.data
          };
        } catch (error) {
          console.error('Error fetching related data:', error.message);
          return order;
        }
      })
    );

    res.json(enrichedOrders);
  } catch (error) {
    next(error);
  }
});

// Delete order
router.delete('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const [result] = await pool.execute(
      'DELETE FROM orders WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
