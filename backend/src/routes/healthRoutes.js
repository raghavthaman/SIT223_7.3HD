const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// @desc    Health check endpoint for DevOps monitoring
// @route   GET /health
router.get('/', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.status(200).json({
    status: 'up',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    service: 'backend-api' // indicating this service is healthy
  });
});

module.exports = router;
