// Validate employee data
const validateEmployee = (req, res, next) => {
    const { name, email, salary, join_date } = req.body;
    const errors = [];

    // Name validation
    if (!name || name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        errors.push('Valid email is required');
    }

    // Salary validation (if provided)
    if (salary && (isNaN(salary) || salary < 0)) {
        errors.push('Salary must be a positive number');
    }

    // Join date validation (if provided)
    if (join_date && isNaN(Date.parse(join_date))) {
        errors.push('Valid join date is required');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: errors
        });
    }

    next();
};

// Validate department data
const validateDepartment = (req, res, next) => {
    const { name, budget } = req.body;
    const errors = [];

    // Name validation
    if (!name || name.trim().length < 2) {
        errors.push('Department name must be at least 2 characters long');
    }

    // Budget validation (if provided)
    if (budget && (isNaN(budget) || budget < 0)) {
        errors.push('Budget must be a positive number');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: errors
        });
    }

    next();
};

// Validate ID parameter
const validateId = (req, res, next) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID parameter'
        });
    }
    
    next();
};

module.exports = {
    validateEmployee,
    validateDepartment,
    validateId
};