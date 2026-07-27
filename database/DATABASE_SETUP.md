# Database Setup Guide - Sales Tracker Pro

## Overview
This guide will help you set up the database for Sales Tracker Pro using Supabase. The database includes two main tables:
- **Products** - Inventory management
- **Sales** - Transaction records

## Prerequisites
- Supabase account (https://supabase.com)
- Project created in Supabase
- Supabase URL and Key obtained

## Database Schema

### Products Table
Stores all product inventory information.

**Columns:**
- `id` - Primary key (auto-increment)
- `product_name` - Product name (required, unique per user)
- `quantity` - Current stock quantity (default: 0)
- `unit_cost` - Cost per unit in GHS (₵)
- `category` - Product category (optional)
- `sku` - Product SKU/code (optional)
- `description` - Product description (optional)
- `user_id` - Owner's user ID (auto-set)
- `created_at` - Creation timestamp (auto-set)
- `updated_at` - Last update timestamp (auto-set)

**Indexes:**
- `idx_products_user_id` - For fast user lookups
- `idx_products_category` - For filtering by category
- `idx_products_sku` - For SKU lookups

### Sales Table
Stores all sales transactions.

**Columns:**
- `id` - Primary key (auto-increment)
- `product_id` - Reference to product (optional)
- `product_name` - Product name
- `quantity` - Units sold
- `revenue` - Total revenue (₵)
- `cost` - Total cost (₵)
- `profit` - Auto-calculated (revenue - cost)
- `date` - Sale date (default: today)
- `category` - Product category
- `customer` - Customer name (optional)
- `notes` - Additional notes (optional)
- `user_id` - Owner's user ID (auto-set)
- `created_at` - Creation timestamp (auto-set)

**Indexes:**
- `idx_sales_user_id` - For fast user lookups
- `idx_sales_date` - For date filtering
- `idx_sales_category` - For category filtering
- `idx_sales_product_id` - For product lookups

## Setup Instructions

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Setup Script
1. Copy the entire content from `supabase-setup.sql`
2. Paste it into the SQL Editor
3. Click **Run** button
4. Wait for the query to complete successfully

The script will:
- Create the `products` table with proper structure
- Create the `sales` table with proper structure
- Set up Row-Level Security (RLS) policies
- Create indexes for performance optimization

### Step 3: Verify Setup
To verify the tables were created correctly:

1. **Check Products Table:**
   ```sql
   SELECT * FROM products LIMIT 1;
   ```

2. **Check Sales Table:**
   ```sql
   SELECT * FROM sales LIMIT 1;
   ```

3. **Check RLS Policies:**
   - Go to **Authentication** > **Policies** in your Supabase dashboard
   - Verify policies exist for both `products` and `sales` tables

### Step 4: Update Environment Variables
Ensure your `.env` file contains:
```
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_KEY=your_anon_key
```

## Security Features

### Row Level Security (RLS)
All tables have RLS enabled to ensure users can only access their own data:

**Products Policies:**
- Users can view own products
- Users can insert own products
- Users can update own products
- Users can delete own products

**Sales Policies:**
- Users can view own sales
- Users can insert own sales
- Users can update own sales
- Users can delete own sales

## Usage

### Adding a Product
Products can be added through the Inventory page in the app:
1. Go to **Inventory** page
2. Click **Add Product**
3. Fill in product details
4. Click **Save Product**

### Recording a Sale
Sales are recorded through the Sales page:
1. Go to **Add Sales** page
2. Select a product from dropdown
3. Enter quantity and unit price
4. Click **Submit**
5. Inventory is automatically decreased

## Troubleshooting

### Issue: "Permission denied" error
**Solution:** Ensure Row Level Security (RLS) is properly enabled and policies are created.

### Issue: Products not saving
**Solution:** 
- Check that you're logged in
- Verify SUPABASE_URL and SUPABASE_KEY in .env
- Check browser console for errors

### Issue: Can't see other users' data
**Solution:** This is correct behavior! RLS policies ensure data isolation for security.

### Issue: Inventory not updating
**Solution:** 
- Clear browser cache
- Refresh the page
- Check that the product exists in inventory
- Check browser console for JavaScript errors

## Data Types Reference

| Type | Description | Example |
|------|-------------|---------|
| BIGSERIAL | Large auto-incrementing integer | 1, 2, 3... |
| VARCHAR(n) | Text with max length | "Laptop" |
| INTEGER | Whole number | 10, 25, 100 |
| DECIMAL(10,2) | Number with 2 decimals | 99.99, 1000.50 |
| DATE | Date without time | 2026-01-20 |
| TIMESTAMP | Date and time with timezone | 2026-01-20 10:30:00 UTC |
| UUID | Unique identifier | auto-generated |
| TEXT | Long text | Multiple paragraphs |

## Advanced Queries

### Get all products for a user
```sql
SELECT * FROM products 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

### Get low stock products (< 10 units)
```sql
SELECT * FROM products 
WHERE quantity < 10 AND user_id = auth.uid();
```

### Get sales summary for a date range
```sql
SELECT 
    DATE(date) as sale_date,
    SUM(revenue) as daily_revenue,
    SUM(profit) as daily_profit,
    COUNT(*) as transaction_count
FROM sales
WHERE user_id = auth.uid()
    AND date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(date)
ORDER BY date DESC;
```

### Get top selling products
```sql
SELECT 
    product_name,
    SUM(quantity) as total_sold,
    SUM(revenue) as total_revenue,
    SUM(profit) as total_profit
FROM sales
WHERE user_id = auth.uid()
GROUP BY product_name
ORDER BY total_sold DESC
LIMIT 10;
```

## Performance Tips

1. **Use indexes** - Queries on `user_id`, `date`, and `category` are optimized
2. **Filter by user first** - Always include user_id in WHERE clause
3. **Limit results** - Use LIMIT clause for large queries
4. **Archive old data** - Consider archiving sales older than 1 year

## Backup Strategy

Regular backups are essential:
1. Go to **Project Settings** > **Backups**
2. Enable automated backups (daily recommended)
3. Download manual backup when needed

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase documentation: https://supabase.com/docs
3. Check browser console for error messages (F12)
