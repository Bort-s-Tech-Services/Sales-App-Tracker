const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const cloudwatchLogger = require('./middleware/cloudwatchLogger');

// Import Route Handlers
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const reportRoutes = require('./routes/reports');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Cross-Origin Resource Sharing
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts for frontend integration
}));
app.use(cors());

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// AWS CloudWatch Request Logging Middleware
app.use(cloudwatchLogger);

// REST API Endpoints Registration
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);

// Optional: Serve frontend static files if hosted directly on same EC2 Express instance
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Fallback for SPA Routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Sales Tracker Cloud API Server Running');
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Global Backend Error]:', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`================================================================`);
  console.log(` Sales Tracker Pro Backend Server Running on Port ${PORT}`);
  console.log(` Target Environment: Amazon EC2 Node.js Cloud Instance`);
  console.log(` Health Check URL: http://localhost:${PORT}/api/health`);
  console.log(`================================================================`);
});

module.exports = app;
