-- =====================================================
-- DEPARTMENT SERVICE DATABASE SCHEMA
-- =====================================================

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  manager_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample departments
INSERT IGNORE INTO departments (name, description, manager_id) VALUES 
  ('Engineering', 'Software development and technical operations', 1),
  ('Product', 'Product management and design', 2),
  ('Human Resources', 'HR operations and employee management', 3),
  ('Design', 'UI/UX and graphic design', NULL);
