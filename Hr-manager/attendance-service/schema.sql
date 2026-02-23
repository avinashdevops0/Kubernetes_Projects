-- =====================================================
-- ATTENDANCE SERVICE DATABASE SCHEMA
-- =====================================================

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  date DATE NOT NULL,
  clock_in TIME,
  clock_out TIME,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_employee_date (employee_id, date)
);

-- Insert sample attendance records
INSERT IGNORE INTO attendance (employee_id, date, clock_in, clock_out, notes) VALUES 
  (1, '2024-01-15', '09:00:00', '17:30:00', 'Regular day'),
  (1, '2024-01-16', '08:55:00', '17:00:00', 'Left early'),
  (2, '2024-01-15', '09:10:00', '18:00:00', 'Regular day'),
  (3, '2024-01-15', '09:00:00', '17:30:00', 'Regular day');
