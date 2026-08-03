# Database Setup Guide - Sales Tracker Pro

## Overview
This guide covers setting up the PostgreSQL database for Sales Tracker Pro using Amazon RDS.

The database includes three main tables:
- **users** — Authentication and account management
- **products** — Inventory management
- **sales** — Transaction records

---

## Prerequisites
- AWS account with RDS access
- pgAdmin 4 or psql installed locally
- RDS instance endpoint, username, and password from your DB Admin

---

## Database Schema

### Users Table
Stores registered user accounts.

**Columns:**
- `id` — Primary key (unique user ID)
- `full_name` — User's full name
- `email` — Unique email address
- `password_hash` — Hashed password
- `company_name` — Optional company name
- `created_at` — Registration timestamp

### Products Table
Stores all product inventory information.

**Columns:**
- `id` — Primary key
- `product_name` — Product name (required)
- `category` — Product category (optional)
- `quantity` — Current stock quantity (default: 0)
- `unit_cost` — Cost per unit in GHS (₵)
- `selling_price` — Selling price in GHS (₵)- `sku` — Product SKU/code (optional)
- `description` — Product description (optional)
- `image_s3_url` — S3 URL for product image (optional)
- `user_id` — Owner's user ID
- `created_at` — Creation timestamp
- `updated_at` — Last update timestamp

### Sales Table
Stores all sales transactions.

**Columns:**
- `id` — Primary key
- `product_id` — Reference to product
- `product_name` — Product name
- `quantity` — Units sold
- `revenue` — Total revenue (₵)
- `cost` — Total cost (₵)
- `profit` — Auto-calculated (revenue - cost)
- `date` — Sale date (default: today)
- `category` — Product category
- `customer` — Customer name (optional)
- `notes` — Additional notes (optional)
- `user_id` — Owner's user ID
- `created_at` — Creation timestamp

---

## Setup Instructions

### Step 1: Connect to RDS in pgAdmin 4
1. Open **pgAdmin 4**
2. Right-click **Servers** → **Register** → **Server**
3. Under **General**: give it a name (e.g. `Sales Tracker RDS`)
4. Under **Connection**:
   - Host: `your-rds-endpoint.rds.amazonaws.com`
   - Port: `5432`
   - Database: `postgres`
   - Username: your RDS master username
   - Password: your RDS master password
5. Click **Save**

### Step 2: Create the Database
1. In pgAdmin, expand your RDS server
2. Right-click **Databases** → **Create** → **Database**
3. Name it `sales_tracker`
4. Click **Save**

### Step 3: Run the Schema
1. Click on `sales_tracker` database → open **Query Tool**
2. Click the folder icon → open `schema.sql`
3. Press **F5** to run
4. Verify no errors in the output panel

### Step 4: Run the Seed Data
1. In the same Query Tool, open `seed.sql`
2. Press **F5** to run
3. This adds sample products and sales data for testing

### Step 5: Verify Setup
Run these queries to confirm everything was created:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check sample data
SELECT * FROM products LIMIT 5;
SELECT * FROM sales LIMIT 5;
```

---

## Connecting the Backend

Once RDS is set up, give the backend developer these credentials:

```env
DATABASE_URL=postgresql://username:password@your-rds-endpoint.rds.amazonaws.com:5432/sales_tracker
```

---

## Security Configuration

### RDS Security Group
Ensure the RDS Security Group allows inbound traffic on port `5432` from:
- Your EC2 instance's Security Group (for production)
- Your local IP (for development/testing only — remove before final deployment)

### IAM
- Use least-privilege IAM roles
- Never expose RDS credentials in the codebase
- Store all credentials in environment variables

---

## Troubleshooting

### Cannot connect to RDS
- Check Security Group inbound rules allow port `5432`
- Confirm Public Accessibility is enabled on the RDS instance
- Verify the endpoint, username, and password are correct

### Tables not created
- Make sure you selected the `sales_tracker` database before running `schema.sql`
- Check the Query Tool output for any SQL errors

### Backend shows "in-memory database"
- The `DATABASE_URL` environment variable is not set or is incorrect
- Restart the backend after updating `.env`

---

## Useful Queries

### Get all products for a user
```sql
SELECT * FROM products
WHERE user_id = 'usr_xxxx'
ORDER BY created_at DESC;
```

### Get low stock products (less than 10 units)
```sql
SELECT * FROM products
WHERE quantity < 10;
```

### Get sales summary for last 30 days
```sql
SELECT
    DATE(date) as sale_date,
    SUM(revenue) as daily_revenue,
    SUM(profit) as daily_profit,
    COUNT(*) as transaction_count
FROM sales
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
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
GROUP BY product_name
ORDER BY total_sold DESC
LIMIT 10;
```
