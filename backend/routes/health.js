const express = require('express');
const router = express.Router();
const { bucketName, region } = require('../config/aws');

// AWS ALB Health Check Endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'sales-tracker-backend',
    awsRegion: region,
    s3Bucket: bucketName,
    uptime: process.uptime()
  });
});

module.exports = router;
