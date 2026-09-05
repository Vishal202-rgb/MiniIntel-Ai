const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, reviewer } = require('../middleware/authMiddleware');

router.get('/', protect, reportController.getReports);
router.get('/:id', protect, reportController.getReportById);
router.post('/generate', protect, reportController.generateReport);
router.put('/:id/submit', protect, reportController.submitForReview);
router.put('/:id/approve', protect, reviewer, reportController.approveReport);
router.put('/:id/reject', protect, reviewer, reportController.rejectReport);
router.get('/:id/export', protect, reportController.exportReport);

module.exports = router;
