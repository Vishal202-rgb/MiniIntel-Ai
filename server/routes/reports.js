const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, reportController.getReports);
router.get('/:id', protect, reportController.getReportById);
router.post('/generate', protect, reportController.generateReport);

module.exports = router;
