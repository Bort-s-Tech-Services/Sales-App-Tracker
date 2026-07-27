const express = require('express');
const router = express.Router();
const { memoryStore, useMemoryStore, query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get All Products for Authenticated User
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    if (useMemoryStore) {
      const items = memoryStore.products.filter(p => p.user_id === userId || userId === 'usr_demo_1001');
      return res.json({ products: items });
    }

    const result = await query('SELECT * FROM products WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json({ products: result.rows });
  } catch (err) {
    console.error('[Products GET Error]:', err);
    res.status(500).json({ error: 'Failed to fetch inventory products' });
  }
});

// Create New Product
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_name, category, quantity, unit_cost, selling_price, sku, description, image_s3_url } = req.body;

    if (!product_name || !category) {
      return res.status(400).json({ error: 'Product name and category are required.' });
    }

    const id = 'prd_' + Date.now();
    const newProduct = {
      id,
      user_id: userId,
      product_name,
      category,
      quantity: Number(quantity) || 0,
      unit_cost: Number(unit_cost) || 0,
      selling_price: Number(selling_price) || 0,
      sku: sku || '',
      description: description || '',
      image_s3_url: image_s3_url || 'https://csbc252-sales-tracker-assets.s3.amazonaws.com/products/default.jpg',
      created_at: new Date()
    };

    if (useMemoryStore) {
      memoryStore.products.unshift(newProduct);
      return res.status(201).json({ message: 'Product created successfully', product: newProduct });
    }

    const q = `INSERT INTO products (id, user_id, product_name, category, quantity, unit_cost, selling_price, sku, description, image_s3_url)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`;
    const resDb = await query(q, [
      id,
      userId,
      product_name,
      category,
      newProduct.quantity,
      newProduct.unit_cost,
      newProduct.selling_price,
      newProduct.sku,
      newProduct.description,
      newProduct.image_s3_url
    ]);

    res.status(201).json({ message: 'Product created successfully', product: resDb.rows[0] });
  } catch (err) {
    console.error('[Product Create Error]:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update Existing Product
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { product_name, category, quantity, unit_cost, selling_price, sku, description, image_s3_url } = req.body;

    if (useMemoryStore) {
      const index = memoryStore.products.findIndex(p => p.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
      }
      const existing = memoryStore.products[index];
      const updated = {
        ...existing,
        product_name: product_name || existing.product_name,
        category: category || existing.category,
        quantity: quantity !== undefined ? Number(quantity) : existing.quantity,
        unit_cost: unit_cost !== undefined ? Number(unit_cost) : existing.unit_cost,
        selling_price: selling_price !== undefined ? Number(selling_price) : existing.selling_price,
        sku: sku !== undefined ? sku : existing.sku,
        description: description !== undefined ? description : existing.description,
        image_s3_url: image_s3_url || existing.image_s3_url,
        updated_at: new Date()
      };
      memoryStore.products[index] = updated;
      return res.json({ message: 'Product updated successfully', product: updated });
    }

    const q = `UPDATE products SET product_name = $1, category = $2, quantity = $3, unit_cost = $4, selling_price = $5,
               sku = $6, description = $7, image_s3_url = $8, updated_at = CURRENT_TIMESTAMP
               WHERE id = $9 AND user_id = $10 RETURNING *`;
    const resDb = await query(q, [product_name, category, quantity, unit_cost, selling_price, sku, description, image_s3_url, id, userId]);
    if (resDb.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }
    res.json({ message: 'Product updated successfully', product: resDb.rows[0] });
  } catch (err) {
    console.error('[Product Update Error]:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete Product
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (useMemoryStore) {
      const idx = memoryStore.products.findIndex(p => p.id === id);
      if (idx !== -1) {
        memoryStore.products.splice(idx, 1);
      }
      return res.json({ message: 'Product deleted successfully' });
    }

    await query('DELETE FROM products WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('[Product Delete Error]:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
