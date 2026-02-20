const express = require('express');
const Joi = require('joi');
const { getPool } = require('../database');

const router = express.Router();

const userSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required()
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email()
}).min(1);

router.post('/', async (req, res, next) => {
  try {
    const { error, value } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const pool = getPool();
    const [result] = await pool.execute(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [value.name, value.email]
    );

    const [newUser] = await pool.execute(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newUser[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const pool = getPool();
    
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = [];
    const values = [];
    if (value.name) {
      updates.push('name = ?');
      values.push(value.name);
    }
    if (value.email) {
      updates.push('email = ?');
      values.push(value.email);
    }
    values.push(req.params.id);

    await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await pool.execute(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [req.params.id]
    );

    res.json(updated[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const [result] = await pool.execute(
      'DELETE FROM users WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
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
      'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;