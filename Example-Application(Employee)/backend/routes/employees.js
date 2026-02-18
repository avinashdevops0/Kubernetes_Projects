const express = require('express');
const router = express.Router();
const { promisePool } = require('../db');
const { validateEmployee } = require('../middleware/validation');

// ==================== EMPLOYEE ROUTES ====================

// CREATE - Add new employee
router.post('/', validateEmployee, async (req, res) => {
    const { name, email, phone, position, department_id, salary, join_date } = req.body;
    
    try {
        const [result] = await promisePool.query(
            `INSERT INTO employees (name, email, phone, position, department_id, salary, join_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, email, phone, position, department_id || null, salary, join_date]
        );

        const [newEmployee] = await promisePool.query(
            `SELECT e.*, d.name as department_name 
             FROM employees e 
             LEFT JOIN departments d ON e.department_id = d.id 
             WHERE e.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            data: newEmployee[0]
        });
    } catch (error) {
        console.error('Error creating employee:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false,
                message: 'Email already exists' 
            });
        }
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    }
});

// READ - Get all employees with optional filters
router.get('/', async (req, res) => {
    const { department, status, search } = req.query;
    let query = `
        SELECT e.*, d.name as department_name 
        FROM employees e 
        LEFT JOIN departments d ON e.department_id = d.id 
    `;
    let conditions = [];
    let params = [];

    if (department) {
        conditions.push('e.department_id = ?');
        params.push(department);
    }

    if (status) {
        conditions.push('e.status = ?');
        params.push(status);
    }

    if (search) {
        conditions.push('(e.name LIKE ? OR e.email LIKE ? OR e.position LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY e.created_at DESC';

    try {
        const [rows] = await promisePool.query(query, params);
        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    }
});

// READ - Get single employee by ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await promisePool.query(
            `SELECT e.*, d.name as department_name 
             FROM employees e 
             LEFT JOIN departments d ON e.department_id = d.id 
             WHERE e.id = ?`,
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Employee not found' 
            });
        }
        
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    }
});

// UPDATE - Update employee
router.put('/:id', validateEmployee, async (req, res) => {
    const { name, email, phone, position, department_id, salary, join_date, status } = req.body;
    const { id } = req.params;

    try {
        const [result] = await promisePool.query(
            `UPDATE employees 
             SET name = ?, email = ?, phone = ?, position = ?, 
                 department_id = ?, salary = ?, join_date = ?, status = ?
             WHERE id = ?`,
            [name, email, phone, position, department_id, salary, join_date, status || 'active', id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Employee not found' 
            });
        }

        const [updatedEmployee] = await promisePool.query(
            `SELECT e.*, d.name as department_name 
             FROM employees e 
             LEFT JOIN departments d ON e.department_id = d.id 
             WHERE e.id = ?`,
            [id]
        );

        res.json({
            success: true,
            message: 'Employee updated successfully',
            data: updatedEmployee[0]
        });
    } catch (error) {
        console.error('Error updating employee:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false,
                message: 'Email already exists' 
            });
        }
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    }
});

// DELETE - Delete employee
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await promisePool.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Employee not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Employee deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    }
});

// PATCH - Update employee status only
router.patch('/:id/status', async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ 
            success: false,
            message: 'Invalid status value' 
        });
    }

    try {
        const [result] = await promisePool.query(
            'UPDATE employees SET status = ? WHERE id = ?',
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Employee not found' 
            });
        }

        res.json({
            success: true,
            message: `Employee status updated to ${status}`
        });
    } catch (error) {
        console.error('Error updating employee status:', error);
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    }
});

module.exports = router;