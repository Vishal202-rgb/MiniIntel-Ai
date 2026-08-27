const express = require('express');
const router = express.Router();
const extractionController = require('../controllers/extractionController');

router.post('/:documentId/extract', extractionController.extract);
router.get('/:documentId', extractionController.getRecords);
router.put('/records/:id', extractionController.updateRecord);
router.post('/records/:id/approve', extractionController.approveRecord);
router.post('/records/:id/reject', extractionController.rejectRecord);
router.post('/records/bulk-approve', extractionController.bulkApprove);

module.exports = router;
