const express = require('express');
const router = express.Router();
const { promisePool } = require('../db');
const { validateDepartment } = require('../middleware/validation');

// ==================== DEPARTMENT ROUTES ====================

// CREATE - Add new department
router.post('/', validateDepartment, async (req, res) => {
    const { name, location, budget } = req.body;

    try {
        const [result] = await promisePool.query(
            'INSERT INTO departments (name, location, budget) VALUES (?, ?, ?)',
            [name, location, budget]
        );

        const [newDept] = await promisePool.query(
            'SELECT * FROM departments WHERE id = ?', 
            [result.insertId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Department created successfully',
            data: newDept[0]
        });
    } catch (error) {
        console.error('Error creating department:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false,
                message: 'Department name already exists' 
            });
        }
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    }
});

// READ - Get all departments with employee count
router.get('/', async (req, res) => {
    try {
        const [rows] = await promisePool.query(`
            SELECT d.*, COUNT(e.id) as employee_count 
            FROM departments d 
            LEFT JOIN employees e ON d.id = e.department_id 
            GROUP BY d.id
            ORDER BY d.name
        `);
        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    }
});

// READ - Get single department with its employees
router.get('/:id', async (req, res) => {
    try {
        // Get department details
        const [deptRows] = await promisePool.query(
            'SELECT * FROM departments WHERE id = ?',
            [req.params.id]
        );
        
        if (deptRows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Department not found' 
            });
        }

        // Get employees in this department
        const [empRows] = await promisePool.query(
            'SELECT id, name, email, position, salary FROM employees WHERE department_id = ?',
            [req.params.id]
        );

        res.json({
            success: true,
            data: {
                ...deptRows[0],
                employees: empRows,
                employee_count: empRows.length
            }
        });
    } catch (error) {
        console.error('Error fetching department:', error);
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    }
});

// UPDATE - Update department
router.put('/:id', validateDepartment, async (req, res) => {
    const { name, location, budget } = req.body;
    const { id } = req.params;

    try {
        const [result] = await promisePool.query(
            'UPDATE departments SET name = ?, location = ?, budget = ? WHERE id = ?',
            [name, location, budget, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Department not found' 
            });
        }

        const [updatedDept] = await promisePool.query(
            'SELECT * FROM departments WHERE id = ?', 
            [id]
        );
        
        res.json({
            success: true,
            message: 'Department updated successfully',
            data: updatedDept[0]
        });
    } catch (error) {
        console.error('Error updating department:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false,
                message: 'Department name already exists' 
            });
        }
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    }
});

// DELETE - Delete department (only if no employees)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Check if department has employees
        const [employees] = await promisePool.query(
            'SELECT COUNT(*) as count FROM employees WHERE department_id = ?',
            [id]
        );

        if (employees[0].count > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Cannot delete department with existing employees. Please reassign or delete employees first.' 
            });
        }

        const [result] = await promisePool.query('DELETE FROM departments WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Department not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Department deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    }
});

// GET - Get department statistics
router.get('/:id/stats', async (req, res) => {
    try {
        const [rows] = await promisePool.query(`
            SELECT 
                d.name,
                COUNT(e.id) as total_employees,
                AVG(e.salary) as avg_salary,
                SUM(e.salary) as total_salary,
                MAX(e.salary) as max_salary,
                MIN(e.salary) as min_salary
            FROM departments d
            LEFT JOIN employees e ON d.id = e.department_id
            WHERE d.id = ?
            GROUP BY d.id
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Department not found' 
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error fetching department stats:', error);
        res.status(500).json({ 
            success: false,
            message: 'Database error' 
        });
    }
});

module.exports = router;