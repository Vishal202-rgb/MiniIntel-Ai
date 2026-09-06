const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/trends', protect, analyticsController.getTrends);
router.get('/anomalies', protect, analyticsController.getAnomalies);
router.get('/dashboard', protect, analyticsController.getDashboardData);

module.exports = router;
