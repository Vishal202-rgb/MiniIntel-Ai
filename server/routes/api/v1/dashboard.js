const express = require('express');
const router = express.Router();
const dashboardController = require('../../../controllers/dashboardController');
const { authenticate } = require('../../../middleware/auth');

router.get('/overview', authenticate, dashboardController.getOverview);
router.get('/kpis', authenticate, dashboardController.getKpis);
router.get('/activity', authenticate, dashboardController.getActivity);
router.get('/alerts', authenticate, dashboardController.getAlerts);
router.get('/recent-documents', authenticate, dashboardController.getRecentDocuments);

module.exports = router;
