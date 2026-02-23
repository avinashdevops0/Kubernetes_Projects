const express = require('express');
const Joi = require('joi');
const { getPool } = require('../database');

const router = express.Router();

const announcementSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  category: Joi.string().valid('general', 'holiday', 'policy', 'urgent').required(),
  content: Joi.string().min(10).required(),
  posted_date: Joi.date().required()
});

const updateAnnouncementSchema = Joi.object({
  title: Joi.string().min(3).max(255),
  category: Joi.string().valid('general', 'holiday', 'policy', 'urgent'),
  content: Joi.string().min(10),
  posted_date: Joi.date()
}).min(1);

router.post('/', async (req, res, next) => {
  try {
    const { error, value } = announcementSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const pool = getPool();
    const [result] = await pool.execute(
      'INSERT INTO announcements (title, category, content, posted_date) VALUES (?, ?, ?, ?)',
      [value.title, value.category, value.content, value.posted_date]
    );

    const [newAnnouncement] = await pool.execute(
      'SELECT * FROM announcements WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newAnnouncement[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM announcements WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { error, value } = updateAnnouncementSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const pool = getPool();
    
    const [existing] = await pool.execute(
      'SELECT id FROM announcements WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const updates = [];
    const values = [];
    if (value.title !== undefined) { updates.push('title = ?'); values.push(value.title); }
    if (value.category !== undefined) { updates.push('category = ?'); values.push(value.category); }
    if (value.content !== undefined) { updates.push('content = ?'); values.push(value.content); }
    if (value.posted_date !== undefined) { updates.push('posted_date = ?'); values.push(value.posted_date); }
    values.push(req.params.id);

    await pool.execute(
      `UPDATE announcements SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await pool.execute(
      'SELECT * FROM announcements WHERE id = ?',
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
      'DELETE FROM announcements WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
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
      'SELECT * FROM announcements ORDER BY posted_date DESC'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
