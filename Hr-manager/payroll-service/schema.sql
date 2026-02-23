-- =====================================================
-- PAYROLL SERVICE DATABASE SCHEMA
-- =====================================================

-- Create payroll table
CREATE TABLE IF NOT EXISTS payroll (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  basic_salary DECIMAL(10,2) NOT NULL,
  allowances DECIMAL(10,2) DEFAULT 0,
  deductions DECIMAL(10,2) DEFAULT 0,
  net_salary DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_employee_period (employee_id, period_start, period_end)
);

-- Insert sample payroll records
INSERT IGNORE INTO payroll (employee_id, period_start, period_end, basic_salary, allowances, deductions, net_salary, status) VALUES 
  (1, '2024-01-01', '2024-01-31', 5000.00, 500.00, 200.00, 5300.00, 'paid'),
  (2, '2024-01-01', '2024-01-31', 4500.00, 300.00, 150.00, 4650.00, 'paid'),
  (3, '2024-01-01', '2024-01-31', 4000.00, 200.00, 100.00, 4100.00, 'processed');
