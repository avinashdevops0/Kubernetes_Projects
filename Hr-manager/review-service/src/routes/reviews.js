const express = require('express');
const Joi = require('joi');
const { getPool } = require('../database');

const router = express.Router();

const reviewSchema = Joi.object({
  employee_id: Joi.number().integer().required(),
  review_date: Joi.date().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comments: Joi.string().allow('')
});

const updateReviewSchema = Joi.object({
  employee_id: Joi.number().integer(),
  review_date: Joi.date(),
  rating: Joi.number().integer().min(1).max(5),
  comments: Joi.string().allow('')
}).min(1);

router.post('/', async (req, res, next) => {
  try {
    const { error, value } = reviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const pool = getPool();
    const [result] = await pool.execute(
      'INSERT INTO reviews (employee_id, review_date, rating, comments) VALUES (?, ?, ?, ?)',
      [value.employee_id, value.review_date, value.rating, value.comments || null]
    );

    const [newReview] = await pool.execute(
      'SELECT * FROM reviews WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newReview[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM reviews WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { error, value } = updateReviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const pool = getPool();
    
    const [existing] = await pool.execute(
      'SELECT id FROM reviews WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const updates = [];
    const values = [];
    if (value.employee_id !== undefined) { updates.push('employee_id = ?'); values.push(value.employee_id); }
    if (value.review_date !== undefined) { updates.push('review_date = ?'); values.push(value.review_date); }
    if (value.rating !== undefined) { updates.push('rating = ?'); values.push(value.rating); }
    if (value.comments !== undefined) { updates.push('comments = ?'); values.push(value.comments); }
    values.push(req.params.id);

    await pool.execute(
      `UPDATE reviews SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await pool.execute(
      'SELECT * FROM reviews WHERE id = ?',
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
      'DELETE FROM reviews WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Review not found' });
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
      'SELECT * FROM reviews ORDER BY review_date DESC'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
