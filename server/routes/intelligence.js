const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getEntities,
  getSimilarDocuments,
  detectChanges,
  getTopicTrends,
  linkEvidence
} = require('../controllers/intelligenceController');

router.get('/entities/:documentId', protect, getEntities);
router.get('/similarity/:documentId', protect, getSimilarDocuments);
router.get('/changes', protect, detectChanges);
router.get('/topics/trends', protect, getTopicTrends);
router.post('/link-evidence/:documentId', protect, linkEvidence);

module.exports = router;
