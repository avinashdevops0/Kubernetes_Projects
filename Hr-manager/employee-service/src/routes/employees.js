const express = require('express');
const Joi = require('joi');
const { getPool } = require('../database');

const router = express.Router();

const employeeSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  position: Joi.string().min(2).max(255).required(),
  department_id: Joi.number().integer().allow(null),
  salary: Joi.number().min(0).required(),
  hire_date: Joi.date().required()
});

const updateEmployeeSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  email: Joi.string().email(),
  position: Joi.string().min(2).max(255),
  department_id: Joi.number().integer().allow(null),
  salary: Joi.number().min(0),
  hire_date: Joi.date()
}).min(1);

function handleDatabaseError(error, res) {
  if (error.code === 'ER_DUP_ENTRY') {
    res.status(409).json({ error: 'Email already exists' });
    return true;
  }

  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    res.status(400).json({ error: 'Invalid department selected' });
    return true;
  }

  if (error.code === 'ER_TRUNCATED_WRONG_VALUE' || error.code === 'ER_BAD_NULL_ERROR') {
    res.status(400).json({ error: 'Invalid employee data provided' });
    return true;
  }

  return false;
}

router.post('/', async (req, res, next) => {
  try {
    const { error, value } = employeeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const pool = getPool();
    const [result] = await pool.execute(
      'INSERT INTO employees (name, email, position, department_id, salary, hire_date) VALUES (?, ?, ?, ?, ?, ?)',
      [value.name, value.email, value.position, value.department_id || null, value.salary, value.hire_date]
    );

    const [newEmployee] = await pool.execute(
      'SELECT * FROM employees WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newEmployee[0]);
  } catch (error) {
    if (handleDatabaseError(error, res)) {
      return;
    }
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM employees WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { error, value } = updateEmployeeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const pool = getPool();
    
    const [existing] = await pool.execute(
      'SELECT id FROM employees WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const updates = [];
    const values = [];
    if (value.name !== undefined) { updates.push('name = ?'); values.push(value.name); }
    if (value.email !== undefined) { updates.push('email = ?'); values.push(value.email); }
    if (value.position !== undefined) { updates.push('position = ?'); values.push(value.position); }
    if (value.department_id !== undefined) { updates.push('department_id = ?'); values.push(value.department_id); }
    if (value.salary !== undefined) { updates.push('salary = ?'); values.push(value.salary); }
    if (value.hire_date !== undefined) { updates.push('hire_date = ?'); values.push(value.hire_date); }
    values.push(req.params.id);

    await pool.execute(
      `UPDATE employees SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await pool.execute(
      'SELECT * FROM employees WHERE id = ?',
      [req.params.id]
    );

    res.json(updated[0]);
  } catch (error) {
    if (handleDatabaseError(error, res)) {
      return;
    }
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const [result] = await pool.execute(
      'DELETE FROM employees WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found' });
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
      'SELECT * FROM employees ORDER BY hire_date DESC'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
