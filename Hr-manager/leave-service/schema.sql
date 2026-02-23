-- =====================================================
-- LEAVE SERVICE DATABASE SCHEMA
-- =====================================================

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leaves (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  leave_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample leave requests
INSERT IGNORE INTO leaves (employee_id, leave_type, start_date, end_date, reason, status) VALUES 
  (1, 'annual', '2024-01-15', '2024-01-20', 'Family vacation', 'approved'),
  (2, 'sick', '2024-02-01', '2024-02-03', 'Doctor appointment', 'approved'),
  (3, 'personal', '2024-02-10', '2024-02-10', 'Personal matter', 'pending');
