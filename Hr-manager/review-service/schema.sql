-- =====================================================
-- REVIEW SERVICE DATABASE SCHEMA
-- =====================================================

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  review_date DATE NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample reviews
INSERT IGNORE INTO reviews (employee_id, review_date, rating, comments) VALUES 
  (1, '2024-01-15', 4, 'Excellent work on the project delivery'),
  (2, '2024-01-20', 5, 'Outstanding leadership and communication'),
  (3, '2024-01-25', 3, 'Good progress, needs improvement in time management');
