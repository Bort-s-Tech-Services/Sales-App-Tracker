const express = require('express');
const router = express.Router();
const { memoryStore, useMemoryStore, query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get Financial Analytics Summary Metrics
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    if (useMemoryStore) {
      const userSales = memoryStore.sales.filter(s => s.user_id === userId || userId === 'usr_demo_1001');
      const userProducts = memoryStore.products.filter(p => p.user_id === userId || userId === 'usr_demo_1001');

      const totalRevenue = userSales.reduce((acc, s) => acc + (Number(s.revenue) || 0), 0);
      const totalCost = userSales.reduce((acc, s) => acc + (Number(s.cost) || 0), 0);
      const totalProfit = totalRevenue - totalCost;
      const totalTransactions = userSales.length;
      const inventoryCount = userProducts.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);

      return res.json({
        summary: {
          totalRevenue,
          totalCost,
          totalProfit,
          totalTransactions,
          inventoryCount,
          averageOrderValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0
        }
      });
    }

    const q = `SELECT 
                 COALESCE(SUM(revenue), 0) AS total_revenue,
                 COALESCE(SUM(cost), 0) AS total_cost,
                 COALESCE(SUM(profit), 0) AS total_profit,
                 COUNT(id) AS total_transactions
               FROM sales WHERE user_id = $1`;
    const resSales = await query(q, [userId]);
    const resInventory = await query('SELECT COALESCE(SUM(quantity), 0) AS inventory_count FROM products WHERE user_id = $1', [userId]);

    const s = resSales.rows[0];
    const totalRev = Number(s.total_revenue);
    const totalTx = Number(s.total_transactions);

    res.json({
      summary: {
        totalRevenue: totalRev,
        totalCost: Number(s.total_cost),
        totalProfit: Number(s.total_profit),
        totalTransactions: totalTx,
        inventoryCount: Number(resInventory.rows[0].inventory_count),
        averageOrderValue: totalTx > 0 ? totalRev / totalTx : 0
      }
    });
  } catch (err) {
    console.error('[Reports Summary Error]:', err);
    res.status(500).json({ error: 'Failed to calculate financial summary metrics' });
  }
});

module.exports = router;
