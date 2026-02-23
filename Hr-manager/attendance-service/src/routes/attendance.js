const express = require('express');
const Joi = require('joi');
const { getPool } = require('../database');

const router = express.Router();

const attendanceSchema = Joi.object({
  employee_id: Joi.number().integer().required(),
  date: Joi.date().required(),
  clock_in: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow(null),
  clock_out: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow(null),
  notes: Joi.string().allow('')
});

const updateAttendanceSchema = Joi.object({
  employee_id: Joi.number().integer(),
  date: Joi.date(),
  clock_in: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow(null),
  clock_out: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow(null),
  notes: Joi.string().allow('')
}).min(1);

router.post('/', async (req, res, next) => {
  try {
    const { error, value } = attendanceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const pool = getPool();
    
    // Check if record already exists for this employee and date
    const [existing] = await pool.execute(
      'SELECT id FROM attendance WHERE employee_id = ? AND date = ?',
      [value.employee_id, value.date]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Attendance record already exists for this date' });
    }

    const [result] = await pool.execute(
      'INSERT INTO attendance (employee_id, date, clock_in, clock_out, notes) VALUES (?, ?, ?, ?, ?)',
      [value.employee_id, value.date, value.clock_in || null, value.clock_out || null, value.notes || null]
    );

    const [newRecord] = await pool.execute(
      'SELECT * FROM attendance WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newRecord[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM attendance WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { error, value } = updateAttendanceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const pool = getPool();
    
    const [existing] = await pool.execute(
      'SELECT id FROM attendance WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    const updates = [];
    const values = [];
    if (value.employee_id !== undefined) { updates.push('employee_id = ?'); values.push(value.employee_id); }
    if (value.date !== undefined) { updates.push('date = ?'); values.push(value.date); }
    if (value.clock_in !== undefined) { updates.push('clock_in = ?'); values.push(value.clock_in); }
    if (value.clock_out !== undefined) { updates.push('clock_out = ?'); values.push(value.clock_out); }
    if (value.notes !== undefined) { updates.push('notes = ?'); values.push(value.notes); }
    values.push(req.params.id);

    await pool.execute(
      `UPDATE attendance SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await pool.execute(
      'SELECT * FROM attendance WHERE id = ?',
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
      'DELETE FROM attendance WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
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
      'SELECT * FROM attendance ORDER BY date DESC, clock_in ASC'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
