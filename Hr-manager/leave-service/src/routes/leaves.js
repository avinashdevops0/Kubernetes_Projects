const express = require('express');
const Joi = require('joi');
const { getPool } = require('../database');

const router = express.Router();

const leaveSchema = Joi.object({
  employee_id: Joi.number().integer().required(),
  leave_type: Joi.string().valid('annual', 'sick', 'personal', 'maternity', 'unpaid').required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().required(),
  reason: Joi.string().allow(''),
  status: Joi.string().valid('pending', 'approved', 'rejected')
});

const updateLeaveSchema = Joi.object({
  employee_id: Joi.number().integer(),
  leave_type: Joi.string().valid('annual', 'sick', 'personal', 'maternity', 'unpaid'),
  start_date: Joi.date(),
  end_date: Joi.date(),
  reason: Joi.string().allow(''),
  status: Joi.string().valid('pending', 'approved', 'rejected')
}).min(1);

router.post('/', async (req, res, next) => {
  try {
    const { error, value } = leaveSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const pool = getPool();
    const [result] = await pool.execute(
      'INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?, ?)',
      [value.employee_id, value.leave_type, value.start_date, value.end_date, value.reason || null, value.status || 'pending']
    );

    const [newLeave] = await pool.execute(
      'SELECT * FROM leaves WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newLeave[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM leaves WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { error, value } = updateLeaveSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const pool = getPool();
    
    const [existing] = await pool.execute(
      'SELECT id FROM leaves WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    const updates = [];
    const values = [];
    if (value.employee_id !== undefined) { updates.push('employee_id = ?'); values.push(value.employee_id); }
    if (value.leave_type !== undefined) { updates.push('leave_type = ?'); values.push(value.leave_type); }
    if (value.start_date !== undefined) { updates.push('start_date = ?'); values.push(value.start_date); }
    if (value.end_date !== undefined) { updates.push('end_date = ?'); values.push(value.end_date); }
    if (value.reason !== undefined) { updates.push('reason = ?'); values.push(value.reason); }
    if (value.status !== undefined) { updates.push('status = ?'); values.push(value.status); }
    values.push(req.params.id);

    await pool.execute(
      `UPDATE leaves SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await pool.execute(
      'SELECT * FROM leaves WHERE id = ?',
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
      'DELETE FROM leaves WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
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
      'SELECT * FROM leaves ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
