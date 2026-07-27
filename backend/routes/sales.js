const express = require('express');
const router = express.Router();
const { memoryStore, useMemoryStore, query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get All Sales Transactions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    if (useMemoryStore) {
      const items = memoryStore.sales.filter(s => s.user_id === userId || userId === 'usr_demo_1001');
      return res.json({ sales: items });
    }

    const result = await query('SELECT * FROM sales WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json({ sales: result.rows });
  } catch (err) {
    console.error('[Sales GET Error]:', err);
    res.status(500).json({ error: 'Failed to fetch sales history' });
  }
});

// Record New Sale Transaction
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, product_name, category, quantity, revenue, cost, customer_name, receipt_s3_url, notes, sale_date } = req.body;

    if (!product_name || !quantity || revenue === undefined) {
      return res.status(400).json({ error: 'Product name, quantity, and total revenue are required.' });
    }

    const qty = Number(quantity);
    const rev = Number(revenue);
    const cst = Number(cost) || 0;
    const profit = rev - cst;
    const id = 'sle_' + Date.now();
    const formattedDate = sale_date || new Date().toISOString().split('T')[0];

    const newSale = {
      id,
      user_id: userId,
      product_id: product_id || null,
      product_name,
      category: category || 'General',
      quantity: qty,
      revenue: rev,
      cost: cst,
      profit,
      customer_name: customer_name || 'Walk-in Customer',
      sale_date: formattedDate,
      receipt_s3_url: receipt_s3_url || null,
      notes: notes || '',
      created_at: new Date()
    };

    if (useMemoryStore) {
      memoryStore.sales.unshift(newSale);

      // Decrement product inventory count if linked
      if (product_id) {
        const prod = memoryStore.products.find(p => p.id === product_id);
        if (prod) {
          prod.quantity = Math.max(0, prod.quantity - qty);
        }
      }
      return res.status(201).json({ message: 'Sale recorded successfully', sale: newSale });
    }

    const q = `INSERT INTO sales (id, user_id, product_id, product_name, category, quantity, revenue, cost, profit, customer_name, sale_date, receipt_s3_url, notes)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`;
    const resDb = await query(q, [
      id,
      userId,
      product_id || null,
      product_name,
      category || 'General',
      qty,
      rev,
      cst,
      profit,
      customer_name || 'Walk-in Customer',
      formattedDate,
      receipt_s3_url || null,
      notes || ''
    ]);

    // Update inventory if linked
    if (product_id) {
      await query('UPDATE products SET quantity = GREATEST(0, quantity - $1) WHERE id = $2', [qty, product_id]);
    }

    res.status(201).json({ message: 'Sale recorded successfully', sale: resDb.rows[0] });
  } catch (err) {
    console.error('[Sale Record Error]:', err);
    res.status(500).json({ error: 'Failed to record sale transaction' });
  }
});

// Delete Sale Transaction
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (useMemoryStore) {
      const idx = memoryStore.sales.findIndex(s => s.id === id);
      if (idx !== -1) {
        memoryStore.sales.splice(idx, 1);
      }
      return res.json({ message: 'Sale deleted successfully' });
    }

    await query('DELETE FROM sales WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: 'Sale deleted successfully' });
  } catch (err) {
    console.error('[Sale Delete Error]:', err);
    res.status(500).json({ error: 'Failed to delete sale record' });
  }
});

module.exports = router;
