-- ============================================================================
-- CSBC 252 Capstone Project - Initial Seed Data Script
-- Sales Tracker Pro Database Seed
-- ============================================================================

-- Insert Test Admin / User
INSERT INTO users (id, full_name, email, password_hash, company_name, role, avatar_s3_url)
VALUES 
(
    'usr_demo_1001',
    'Demo Cloud Admin',
    'admin@salestracker.cloud',
    '$2a$10$mf65jmcIUxesxFNOWXnk4uHneCEh25cm.t5pGM0gr6ZGROJGEyGBS', -- Demo bcrypt hash for admin1234567890
    'Borts Tech Services Ltd',
    'admin',
    'https://csbc252-sales-tracker-assets.s3.amazonaws.com/avatars/admin.jpg'
)
ON CONFLICT (id) DO NOTHING;

-- Insert Mock Inventory Products
INSERT INTO products (id, user_id, product_name, category, quantity, unit_cost, selling_price, sku, description, image_s3_url)
VALUES
(
    'prd_101',
    'usr_demo_1001',
    'Wireless Noise-Canceling Headphones',
    'Electronics',
    45,
    350.00,
    599.99,
    'EL-WNC-01',
    'Premium over-ear wireless headphones with active noise cancellation.',
    'https://csbc252-sales-tracker-assets.s3.amazonaws.com/products/headphones.jpg'
),
(
    'prd_102',
    'usr_demo_1001',
    'Ergonomic Executive Office Chair',
    'Furniture',
    18,
    450.00,
    799.00,
    'FN-EOC-02',
    'High-back breathable mesh ergonomic office chair with lumbar support.',
    'https://csbc252-sales-tracker-assets.s3.amazonaws.com/products/chair.jpg'
),
(
    'prd_103',
    'usr_demo_1001',
    'Smart Watch Fitness Tracker Pro',
    'Electronics',
    60,
    120.00,
    249.99,
    'EL-SWF-03',
    'Water-resistant smartwatch with heart-rate monitor and GPS tracking.',
    'https://csbc252-sales-tracker-assets.s3.amazonaws.com/products/smartwatch.jpg'
),
(
    'prd_104',
    'usr_demo_1001',
    'Organic Arabica Coffee Beans (1kg)',
    'Food & Beverage',
    120,
    45.00,
    89.00,
    'FB-OAC-04',
    'Fair-trade single-origin whole bean coffee roasted locally.',
    'https://csbc252-sales-tracker-assets.s3.amazonaws.com/products/coffee.jpg'
)
ON CONFLICT (id) DO NOTHING;

-- Insert Mock Transaction Sales
INSERT INTO sales (id, user_id, product_id, product_name, category, quantity, revenue, cost, profit, customer_name, sale_date, receipt_s3_url, notes)
VALUES
(
    'sle_501',
    'usr_demo_1001',
    'prd_101',
    'Wireless Noise-Canceling Headphones',
    'Electronics',
    2,
    1199.98,
    700.00,
    499.98,
    'Acme Tech Innovations',
    CURRENT_DATE - INTERVAL '3 days',
    'https://csbc252-sales-tracker-assets.s3.amazonaws.com/receipts/rec_501.pdf',
    'Corporate bulk order'
),
(
    'sle_502',
    'usr_demo_1001',
    'prd_103',
    'Smart Watch Fitness Tracker Pro',
    'Electronics',
    5,
    1249.95,
    600.00,
    649.95,
    'Kofi Mensah',
    CURRENT_DATE - INTERVAL '2 days',
    'https://csbc252-sales-tracker-assets.s3.amazonaws.com/receipts/rec_502.pdf',
    'Online store checkout'
),
(
    'sle_503',
    'usr_demo_1001',
    'prd_104',
    'Organic Arabica Coffee Beans (1kg)',
    'Food & Beverage',
    10,
    890.00,
    450.00,
    440.00,
    'Sunrise Cafe & Bakery',
    CURRENT_DATE - INTERVAL '1 days',
    'https://csbc252-sales-tracker-assets.s3.amazonaws.com/receipts/rec_503.pdf',
    'Weekly coffee supply contract'
),
(
    'sle_504',
    'usr_demo_1001',
    'prd_102',
    'Ergonomic Executive Office Chair',
    'Furniture',
    3,
    2397.00,
    1350.00,
    1047.00,
    'Global Design Studio',
    CURRENT_DATE,
    'https://csbc252-sales-tracker-assets.s3.amazonaws.com/receipts/rec_504.pdf',
    'Office refurbishment order'
)
ON CONFLICT (id) DO NOTHING;
