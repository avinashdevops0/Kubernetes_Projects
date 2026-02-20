-- =====================================================
-- USER SERVICE DATABASE SCHEMA
-- =====================================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- SAMPLE DATA - Statistics
-- =====================================================

-- Insert sample users (statistics/data)
INSERT INTO users (name, email) VALUES 
  ('John Doe', 'john.doe@example.com'),
  ('Jane Smith', 'jane.smith@example.com'),
  ('Bob Johnson', 'bob.johnson@example.com'),
  ('Alice Williams', 'alice.williams@example.com'),
  ('Charlie Brown', 'charlie.brown@example.com'),
  ('Diana Prince', 'diana.prince@example.com'),
  ('Edward Norton', 'edward.norton@example.com'),
  ('Fiona Apple', 'fiona.apple@example.com'),
  ('George Miller', 'george.miller@example.com'),
  ('Hannah Montana', 'hannah.montana@example.com');

-- Query to check total users count
-- SELECT COUNT(*) AS total_users FROM users;
