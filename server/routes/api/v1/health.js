const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { sendSuccess } = require('../../../utils/apiResponse');

/**
 * @route   GET /api/v1/health
 * @desc    System and API health check endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const dbStatus = dbStateMap[mongoose.connection.readyState] || 'unknown';
  const isHealthy = dbStatus === 'connected';

  const healthData = {
    api: isHealthy ? 'healthy' : 'degraded',
    server: 'online',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    version: 'v1',
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development'
  };

  return sendSuccess(
    res,
    healthData,
    isHealthy ? 'MineIntel AI API v1 is operational' : 'MineIntel AI API v1 is degraded (database connecting/disconnected)',
    isHealthy ? 200 : 503
  );
});

module.exports = router;
