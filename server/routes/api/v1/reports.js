const express = require('express');
const router = express.Router();
const reportController = require('../../../controllers/reportController');
const { authenticate, admin, reviewer } = require('../../../middleware/auth');
const validate = require('../../../validators/validate');
const {
  validateGenerateReport,
  validateUpdateReport,
  validateRejectReport,
  validateReportId
} = require('../../../validators/reportValidator');

// 1. Reports CRUD & Generation
router.post('/generate', authenticate, validate(validateGenerateReport), reportController.generateReport);
router.get('/', authenticate, reportController.getReports);
router.get('/:id', authenticate, validate(validateReportId), reportController.getReportById);
router.put('/:id', authenticate, validate(validateReportId), validate(validateUpdateReport), reportController.updateReport);
router.delete('/:id', authenticate, validate(validateReportId), reportController.deleteReport);

// 2. Review workflow (on report resource)
router.post('/:id/submit-review', authenticate, validate(validateReportId), reportController.submitForReview);
router.put('/:id/submit', authenticate, validate(validateReportId), reportController.submitForReview);
router.post('/:id/approve', authenticate, admin, validate(validateReportId), reportController.approveReport);
router.put('/:id/approve', authenticate, admin, validate(validateReportId), reportController.approveReport);
router.post('/:id/reject', authenticate, reviewer, validate(validateReportId), validate(validateRejectReport), reportController.rejectReport);
router.put('/:id/reject', authenticate, reviewer, validate(validateReportId), validate(validateRejectReport), reportController.rejectReport);

// 3. Evidence
router.get('/:id/evidence', authenticate, validate(validateReportId), reportController.getEvidence);

// 4. Versions
router.get('/:id/version-history', authenticate, validate(validateReportId), reportController.getVersionHistory);
router.get('/:id/changes', authenticate, validate(validateReportId), reportController.getChanges);

// 5. Dedicated Exports
router.get('/:id/export/pdf', authenticate, validate(validateReportId), reportController.exportPdf);
router.get('/:id/export/docx', authenticate, validate(validateReportId), reportController.exportDocx);
router.get('/:id/export/csv', authenticate, validate(validateReportId), reportController.exportCsv);
router.get('/:id/export/json', authenticate, validate(validateReportId), reportController.exportJson);

// Legacy / query-string export fallback: GET /:id/export?format=pdf|docx|csv|json
router.get('/:id/export', authenticate, validate(validateReportId), reportController.exportReport);

module.exports = router;
