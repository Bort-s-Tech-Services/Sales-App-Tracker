-- Drop tables if exists (for clean setup)
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Create products/inventory table
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit_cost DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(product_name, user_id)
);

-- Enable Row Level Security for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for products
CREATE POLICY "Users can view own products"
    ON products FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
    ON products FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
    ON products FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
    ON products FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for products
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_category ON products(category);

-- Create sales table
CREATE TABLE sales (
    id BIGSERIAL PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    revenue DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    profit DECIMAL(10,2) GENERATED ALWAYS AS (revenue - cost) STORED,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(100),
    customer VARCHAR(255),
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_sales_category ON sales(category);

-- Enable Row Level Security
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own sales"
    ON sales FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales"
    ON sales FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales"
    ON sales FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sales"
    ON sales FOR DELETE
    USING (auth.uid() = user_id);

-- Create a function to get user's sales summary
CREATE OR REPLACE FUNCTION get_sales_summary(user_uuid UUID, period_days INTEGER)
RETURNS TABLE (
    total_revenue DECIMAL,
    total_profit DECIMAL,
    avg_sale_value DECIMAL,
    total_transactions BIGINT,
    best_product VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(s.revenue), 0) as total_revenue,
        COALESCE(SUM(s.profit), 0) as total_profit,
        COALESCE(AVG(s.revenue), 0) as avg_sale_value,
        COUNT(*) as total_transactions,
        (SELECT product_name 
         FROM sales s2 
         WHERE s2.user_id = user_uuid 
         AND s2.date >= CURRENT_DATE - period_days
         GROUP BY product_name 
         ORDER BY SUM(quantity) DESC 
         LIMIT 1) as best_product
    FROM sales s
    WHERE s.user_id = user_uuid
    AND s.date >= CURRENT_DATE - period_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample data (optional - for testing)
INSERT INTO sales (product_name, quantity, revenue, cost, date, category, user_id) VALUES
    ('Premium Laptop', 1, 1299.99, 899.99, CURRENT_DATE, 'Electronics', '00000000-0000-0000-0000-000000000000'),
    ('Wireless Mouse', 3, 89.97, 44.97, CURRENT_DATE, 'Accessories', '00000000-0000-0000-0000-000000000000'),
    ('Coffee Mug Set', 2, 39.98, 19.98, CURRENT_DATE - 1, 'Home', '00000000-0000-0000-0000-000000000000'),
    ('Office Chair', 1, 299.99, 179.99, CURRENT_DATE - 2, 'Furniture', '00000000-0000-0000-0000-000000000000'),
    ('USB-C Cable', 5, 49.95, 24.95, CURRENT_DATE - 3, 'Accessories', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;