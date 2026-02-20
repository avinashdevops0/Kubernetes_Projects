-- =====================================================
-- PRODUCT SERVICE DATABASE SCHEMA
-- =====================================================

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- SAMPLE DATA - Statistics
-- =====================================================

-- Insert sample products (statistics/data)
INSERT INTO products (name, price, description) VALUES 
  ('MacBook Pro 16"', 2499.99, 'Apple MacBook Pro with M3 chip'),
  ('iPhone 15 Pro', 999.99, 'Latest iPhone with titanium design'),
  ('AirPods Pro', 249.99, 'Wireless earbuds with noise cancellation'),
  ('iPad Air', 599.99, '10.9-inch display with M2 chip'),
  ('Apple Watch Ultra', 799.99, 'Adventure-ready smartwatch'),
  ('Dell XPS 15', 1799.99, 'Windows laptop with OLED display'),
  ('Sony WH-1000XM5', 399.99, 'Premium noise-canceling headphones'),
  ('Samsung Galaxy S24', 899.99, 'Android flagship smartphone'),
  ('Logitech MX Master', 99.99, 'Wireless ergonomic mouse'),
  ('Keychron Q1 Pro', 199.99, 'Mechanical keyboard with QMK/VIA');

-- Query to check total products and average price
-- SELECT COUNT(*) AS total_products, AVG(price) AS average_price FROM products;

-- Query to get products by price range
-- SELECT * FROM products WHERE price BETWEEN 100 AND 500;
