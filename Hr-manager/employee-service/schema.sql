-- =====================================================
-- EMPLOYEE SERVICE DATABASE SCHEMA
-- =====================================================

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  position VARCHAR(255) NOT NULL,
  department_id INT,
  salary DECIMAL(10, 2) NOT NULL,
  hire_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample employees
INSERT IGNORE INTO employees (name, email, position, department_id, salary, hire_date) VALUES 
  ('John Doe', 'john.doe@company.com', 'Software Engineer', 1, 75000.00, '2023-01-15'),
  ('Jane Smith', 'jane.smith@company.com', 'Product Manager', 2, 85000.00, '2022-06-20'),
  ('Bob Johnson', 'bob.johnson@company.com', 'HR Specialist', 3, 65000.00, '2023-03-10'),
  ('Alice Williams', 'alice.williams@company.com', 'Designer', 4, 70000.00, '2022-09-05'),
  ('Charlie Brown', 'charlie.brown@company.com', 'QA Engineer', 1, 60000.00, '2023-07-22');
