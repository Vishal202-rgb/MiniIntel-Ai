const express = require('express');
const router = express.Router();
const analyticsController = require('../../../controllers/analyticsController');
const { authenticate } = require('../../../middleware/auth');

// REST v1 Analytics Endpoints
router.get('/overview', authenticate, analyticsController.getOverview);
router.get('/kpis', authenticate, analyticsController.getKPIs);
router.get('/production', authenticate, analyticsController.getProduction);
router.get('/dispatch', authenticate, analyticsController.getDispatch);
router.get('/trends', authenticate, analyticsController.getTrends);
router.get('/variance', authenticate, analyticsController.getVariance);
router.get('/anomalies', authenticate, analyticsController.getAnomalies);

// Legacy dashboard alias
router.get('/dashboard', authenticate, analyticsController.getDashboardData);

module.exports = router;
