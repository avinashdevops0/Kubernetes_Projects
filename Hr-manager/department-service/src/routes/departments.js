const express = require('express');
const Joi = require('joi');
const { getPool } = require('../database');

const router = express.Router();

const departmentSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  description: Joi.string().allow(''),
  manager_id: Joi.number().integer().allow(null)
});

const updateDepartmentSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  description: Joi.string().allow(''),
  manager_id: Joi.number().integer().allow(null)
}).min(1);

router.post('/', async (req, res, next) => {
  try {
    const { error, value } = departmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const pool = getPool();
    const [result] = await pool.execute(
      'INSERT INTO departments (name, description, manager_id) VALUES (?, ?, ?)',
      [value.name, value.description || null, value.manager_id || null]
    );

    const [newDepartment] = await pool.execute(
      'SELECT * FROM departments WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newDepartment[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM departments WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { error, value } = updateDepartmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const pool = getPool();
    
    const [existing] = await pool.execute(
      'SELECT id FROM departments WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const updates = [];
    const values = [];
    if (value.name !== undefined) { updates.push('name = ?'); values.push(value.name); }
    if (value.description !== undefined) { updates.push('description = ?'); values.push(value.description); }
    if (value.manager_id !== undefined) { updates.push('manager_id = ?'); values.push(value.manager_id); }
    values.push(req.params.id);

    await pool.execute(
      `UPDATE departments SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await pool.execute(
      'SELECT * FROM departments WHERE id = ?',
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
      'DELETE FROM departments WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Department not found' });
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
      'SELECT * FROM departments ORDER BY name ASC'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
