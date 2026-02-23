-- =====================================================
-- ANNOUNCEMENT SERVICE DATABASE SCHEMA
-- =====================================================

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  posted_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample announcements
INSERT IGNORE INTO announcements (title, category, content, posted_date) VALUES 
  ('Company Annual Picnic', 'holiday', 'Join us for our annual company picnic on January 30th!', '2024-01-10'),
  ('New Office Policies Update', 'policy', 'Please review the updated office policies effective from next month.', '2024-01-12'),
  ('System Maintenance Notice', 'urgent', 'The HR system will be down for maintenance on Saturday from 2-4 AM.', '2024-01-15');
