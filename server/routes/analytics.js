const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/trends', analyticsController.getTrends);
router.get('/anomalies', analyticsController.getAnomalies);

module.exports = router;
