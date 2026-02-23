const express = require('express');
const Joi = require('joi');
const { getPool } = require('../database');

const router = express.Router();

const payrollSchema = Joi.object({
  employee_id: Joi.number().integer().required(),
  period_start: Joi.date().required(),
  period_end: Joi.date().required(),
  basic_salary: Joi.number().positive().required(),
  allowances: Joi.number().min(0).default(0),
  deductions: Joi.number().min(0).default(0),
  net_salary: Joi.number().positive().required(),
  status: Joi.string().valid('pending', 'processed', 'paid')
});

const updatePayrollSchema = Joi.object({
  employee_id: Joi.number().integer(),
  period_start: Joi.date(),
  period_end: Joi.date(),
  basic_salary: Joi.number().positive(),
  allowances: Joi.number().min(0),
  deductions: Joi.number().min(0),
  net_salary: Joi.number().positive(),
  status: Joi.string().valid('pending', 'processed', 'paid')
}).min(1);

router.post('/', async (req, res, next) => {
  try {
    const { error, value } = payrollSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const pool = getPool();
    
    // Check if payroll already exists for this employee and period
    const [existing] = await pool.execute(
      'SELECT id FROM payroll WHERE employee_id = ? AND period_start = ? AND period_end = ?',
      [value.employee_id, value.period_start, value.period_end]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Payroll record already exists for this period' });
    }

    const [result] = await pool.execute(
      'INSERT INTO payroll (employee_id, period_start, period_end, basic_salary, allowances, deductions, net_salary, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [value.employee_id, value.period_start, value.period_end, value.basic_salary, value.allowances || 0, value.deductions || 0, value.net_salary, value.status || 'pending']
    );

    const [newPayroll] = await pool.execute(
      'SELECT * FROM payroll WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newPayroll[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM payroll WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { error, value } = updatePayrollSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const pool = getPool();
    
    const [existing] = await pool.execute(
      'SELECT id FROM payroll WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }

    const updates = [];
    const values = [];
    if (value.employee_id !== undefined) { updates.push('employee_id = ?'); values.push(value.employee_id); }
    if (value.period_start !== undefined) { updates.push('period_start = ?'); values.push(value.period_start); }
    if (value.period_end !== undefined) { updates.push('period_end = ?'); values.push(value.period_end); }
    if (value.basic_salary !== undefined) { updates.push('basic_salary = ?'); values.push(value.basic_salary); }
    if (value.allowances !== undefined) { updates.push('allowances = ?'); values.push(value.allowances); }
    if (value.deductions !== undefined) { updates.push('deductions = ?'); values.push(value.deductions); }
    if (value.net_salary !== undefined) { updates.push('net_salary = ?'); values.push(value.net_salary); }
    if (value.status !== undefined) { updates.push('status = ?'); values.push(value.status); }
    values.push(req.params.id);

    await pool.execute(
      `UPDATE payroll SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await pool.execute(
      'SELECT * FROM payroll WHERE id = ?',
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
      'DELETE FROM payroll WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payroll record not found' });
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
      'SELECT * FROM payroll ORDER BY period_end DESC, employee_id ASC'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
