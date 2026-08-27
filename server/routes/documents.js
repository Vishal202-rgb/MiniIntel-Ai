const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  uploadDocument,
  getDocuments,
  getDocumentById,
  getDocumentStatus,
  deleteDocument,
  retryDocument
} = require('../controllers/documentController');

router.post('/upload', upload, uploadDocument);
router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.get('/:id/status', getDocumentStatus);
router.delete('/:id', deleteDocument);
router.post('/:id/retry', retryDocument);

module.exports = router;
