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
const { protect } = require('../middleware/authMiddleware');

router.post('/upload', protect, upload, uploadDocument);
router.get('/', protect, getDocuments);
router.get('/:id', protect, getDocumentById);
router.get('/:id/status', protect, getDocumentStatus);
router.delete('/:id', protect, deleteDocument);
router.post('/:id/retry', protect, retryDocument);

module.exports = router;
