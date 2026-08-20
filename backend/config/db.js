const { Pool } = require('pg');
require('dotenv').config();

// Memory store fallback for testing when RDS PostgreSQL is not connected locally
const memoryStore = {
  users: [
    {
      id: 'usr_demo_1001',
      full_name: 'Demo Cloud Admin',
      email: 'admin@salestracker.cloud',
      password_hash: '$2a$10$mf65jmcIUxesxFNOWXnk4uHneCEh25cm.t5pGM0gr6ZGROJGEyGBS',
      company_name: 'Cloud Retail Solutions Ltd',
      role: 'admin',
      avatar_s3_url: 'https://csbc252-sales-tracker-assets.s3.amazonaws.com/avatars/admin.jpg',
      created_at: new Date()
    }
  ],
  products: [
    {
      id: 'prd_101',
      user_id: 'usr_demo_1001',
      product_name: 'Wireless Noise-Canceling Headphones',
      category: 'Electronics',
      quantity: 45,
      unit_cost: 350.00,
      selling_price: 599.99,
      sku: 'EL-WNC-01',
      description: 'Premium over-ear wireless headphones with active noise cancellation.',
      image_s3_url: 'https://csbc252-sales-tracker-assets.s3.amazonaws.com/products/headphones.jpg',
      created_at: new Date()
    },
    {
      id: 'prd_102',
      user_id: 'usr_demo_1001',
      product_name: 'Ergonomic Executive Office Chair',
      category: 'Furniture',
      quantity: 18,
      unit_cost: 450.00,
      selling_price: 799.00,
      sku: 'FN-EOC-02',
      description: 'High-back breathable mesh ergonomic office chair.',
      image_s3_url: 'https://csbc252-sales-tracker-assets.s3.amazonaws.com/products/chair.jpg',
      created_at: new Date()
    }
  ],
  sales: [
    {
      id: 'sle_501',
      user_id: 'usr_demo_1001',
      product_id: 'prd_101',
      product_name: 'Wireless Noise-Canceling Headphones',
      category: 'Electronics',
      quantity: 2,
      revenue: 1199.98,
      cost: 700.00,
      profit: 499.98,
      customer_name: 'Acme Tech Innovations',
      sale_date: new Date().toISOString().split('T')[0],
      receipt_s3_url: 'https://csbc252-sales-tracker-assets.s3.amazonaws.com/receipts/rec_501.pdf',
      notes: 'Corporate bulk order',
      created_at: new Date()
    }
  ],
  uploaded_assets: []
};

let pool = null;
let useMemoryStore = true;

if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql://')) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    useMemoryStore = false;
    console.log('[Database] Configured PostgreSQL pool for Amazon RDS connection.');
  } catch (err) {
    console.warn('[Database] RDS Connection failed. Falling back to in-memory cloud datastore:', err.message);
    useMemoryStore = true;
  }
} else {
  console.log('[Database] DATABASE_URL not set to PostgreSQL RDS. Running in-memory database store.');
}

const query = async (text, params) => {
  if (!useMemoryStore && pool) {
    return pool.query(text, params);
  }
  return { rows: [] };
};

module.exports = {
  query,
  pool,
  memoryStore,
  useMemoryStore
};
