-- =====================================================
-- ORDER SERVICE DATABASE SCHEMA  
-- =====================================================

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  total_price DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_product_id (product_id)
);

-- =====================================================
-- SAMPLE DATA - Statistics / Orders Data
-- =====================================================

-- Insert sample orders 
INSERT INTO orders (user_id, product_id, quantity, total_price, status) VALUES 
(1, 1, 1, 2499.99, 'completed'),
(2, 2, 2, 1999.98, 'completed'),
(3, 3, 1, 249.99, 'processing'),
(4, 4, 1, 599.99, 'pending'),
(5, 5, 1, 799.99, 'cancelled'),
(6, 6, 2, 3599.98, 'completed'),
(7, 7, 1, 399.99, 'processing'),
(8, 8, 3, 2699.97, 'completed'),
(9, 9, 2, 199.98, 'pending'),
(10, 10, 1, 199.99, 'completed');

-- =====================================================
-- STATISTICS QUERIES
-- =====================================================

-- Total orders count
-- SELECT COUNT(*) AS total_orders FROM orders;

-- Orders by status
-- SELECT status, COUNT(*) AS count, SUM(total_price) AS total_amount FROM orders GROUP BY status;

-- Total revenue
-- SELECT SUM(total_price) AS total_revenue FROM orders WHERE status = 'completed';

-- Orders per user
-- SELECT user_id, COUNT(*) AS order_count, SUM(total_price) AS total_spent FROM orders GROUP BY user_id;

-- Most popular products
-- SELECT product_id, SUM(quantity) AS total_sold, SUM(total_price) AS revenue FROM orders GROUP BY product_id ORDER BY total_sold DESC;

-- Average order value
-- SELECT AVG(total_price) AS average_order_value FROM orders;

-- Orders created today
-- SELECT * FROM orders WHERE DATE(created_at) = CURDATE();

-- Monthly orders summary
-- SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS orders, SUM(total_price) AS revenue FROM orders GROUP BY month;
