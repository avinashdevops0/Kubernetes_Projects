const express = require('express');
const Joi = require('joi');
const { getPool } = require('../database');

const router = express.Router();

const productSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  price: Joi.number().positive().precision(2).required(),
  description: Joi.string().max(500).optional()
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(200),
  price: Joi.number().positive().precision(2),
  description: Joi.string().max(500)
}).min(1);

router.post('/', async (req, res, next) => {
  try {
    const { error, value } = productSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const pool = getPool();
    const [result] = await pool.execute(
      'INSERT INTO products (name, price, description) VALUES (?, ?, ?)',
      [value.name, value.price, value.description || null]
    );

    const [newProduct] = await pool.execute(
      'SELECT id, name, price, description, created_at FROM products WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newProduct[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, name, price, description, created_at FROM products WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { error, value } = updateProductSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const pool = getPool();
    
    const [existing] = await pool.execute(
      'SELECT id FROM products WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updates = [];
    const values = [];
    if (value.name) {
      updates.push('name = ?');
      values.push(value.name);
    }
    if (value.price) {
      updates.push('price = ?');
      values.push(value.price);
    }
    if (value.description !== undefined) {
      updates.push('description = ?');
      values.push(value.description);
    }
    values.push(req.params.id);

    await pool.execute(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await pool.execute(
      'SELECT id, name, price, description, created_at FROM products WHERE id = ?',
      [req.params.id]
    );

    res.json(updated[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const [result] = await pool.execute(
      'DELETE FROM products WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, name, price, description, created_at FROM products ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;