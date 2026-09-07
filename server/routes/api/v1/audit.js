const express = require('express');
const router = express.Router();
const auditController = require('../../../controllers/auditController');
const { authenticate } = require('../../../middleware/auth');
const validate = require('../../../validators/validate');
const {
  validateAuditId,
  validateUserId,
  validateDocumentId,
  validateReportId
} = require('../../../validators/auditValidator');

// 1. Audit logs listing & statistics
router.get('/', authenticate, auditController.getAuditLogs);
router.get('/stats', authenticate, auditController.getAuditStats);

// 2. Export audit logs (CSV or JSON)
router.get('/export', authenticate, auditController.exportAuditLogs);

// 3. Filtered audit lookups
router.get('/user/:userId', authenticate, validate(validateUserId), auditController.getAuditByUser);
router.get('/document/:documentId', authenticate, validate(validateDocumentId), auditController.getAuditByDocument);
router.get('/report/:reportId', authenticate, validate(validateReportId), auditController.getAuditByReport);

// 4. Single audit log by ID
router.get('/:id', authenticate, validate(validateAuditId), auditController.getAuditById);

module.exports = router;
