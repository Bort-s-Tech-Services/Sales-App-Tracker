-- ============================================================================
-- CSBC 252 Capstone Project - Sales Tracker Pro Database Schema
-- Target Environment: Amazon RDS (PostgreSQL / MySQL compatible)
-- Description: Core schema for user management, inventory products, sales,
--              and S3 uploaded asset references.
-- ============================================================================

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    company_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user', -- 'user', 'admin'
    avatar_s3_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Index for Fast User Authentication
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create Products Table (Inventory Management)
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_name VARCHAR(150) NOT NULL,
    category VARCHAR(80) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    unit_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    sku VARCHAR(50),
    description TEXT,
    image_s3_url VARCHAR(500), -- Amazon S3 Public/Signed URL for Product Image
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Product Searches
CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Create Sales Table (Transactions)
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id VARCHAR(36) REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(150) NOT NULL,
    category VARCHAR(80) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    revenue DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    profit DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    customer_name VARCHAR(100),
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_s3_url VARCHAR(500), -- Amazon S3 URL for uploaded receipt document
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Sales Analytics
CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_category ON sales(category);
CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(product_id);

-- Create Uploaded Assets Audit Table (Amazon S3 Tracking)
CREATE TABLE IF NOT EXISTS uploaded_assets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    s3_key VARCHAR(255) NOT NULL,
    s3_bucket VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    s3_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_uploaded_assets_user ON uploaded_assets(user_id);

-- Create View for Financial Dashboard Metrics
CREATE OR REPLACE VIEW v_user_sales_summary AS
SELECT 
    user_id,
    COUNT(id) AS total_transactions,
    COALESCE(SUM(revenue), 0) AS total_revenue,
    COALESCE(SUM(cost), 0) AS total_cost,
    COALESCE(SUM(profit), 0) AS total_profit,
    COALESCE(AVG(revenue), 0) AS avg_transaction_value
FROM sales
GROUP BY user_id;
