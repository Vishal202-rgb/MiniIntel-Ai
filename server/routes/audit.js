const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, auditController.getAuditLogs);
router.get('/stats', protect, auditController.getAuditStats);

module.exports = router;
