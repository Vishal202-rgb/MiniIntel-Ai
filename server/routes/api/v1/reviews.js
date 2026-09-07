const express = require('express');
const router = express.Router();
const reportController = require('../../../controllers/reportController');
const { authenticate, admin, reviewer } = require('../../../middleware/auth');
const validate = require('../../../validators/validate');
const {
  validateRejectReport,
  validateReportId
} = require('../../../validators/reportValidator');

// GET /api/v1/reviews/pending - List all reports currently pending review
router.get('/pending', authenticate, reportController.getPendingReviews);

// GET /api/v1/reviews/:id - Get review details for a specific report
router.get('/:id', authenticate, validate(validateReportId), reportController.getReviewById);

// POST /api/v1/reviews/:id/approve - Approve report (ADMIN ONLY)
router.post('/:id/approve', authenticate, admin, validate(validateReportId), reportController.approveReport);
router.put('/:id/approve', authenticate, admin, validate(validateReportId), reportController.approveReport);

// POST /api/v1/reviews/:id/reject - Reject report with reason
router.post('/:id/reject', authenticate, reviewer, validate(validateReportId), validate(validateRejectReport), reportController.rejectReport);
router.put('/:id/reject', authenticate, reviewer, validate(validateReportId), validate(validateRejectReport), reportController.rejectReport);

module.exports = router;
