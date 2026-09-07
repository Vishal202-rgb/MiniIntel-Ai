const express = require('express');
const router = express.Router();
const intelligenceController = require('../../../controllers/intelligenceController');
const { authenticate } = require('../../../middleware/auth');

// REST v1 Intelligence Endpoints
router.get('/', authenticate, intelligenceController.getIntelligenceOverview);
router.post('/analyze', authenticate, intelligenceController.analyzeIntelligence);
router.get('/trends', authenticate, intelligenceController.getTopicTrends);
router.get('/entities', authenticate, intelligenceController.getAllEntities);
router.get('/clusters', authenticate, intelligenceController.getClusters);
router.get('/similarity', authenticate, intelligenceController.getSimilarity);
router.get('/changes', authenticate, intelligenceController.detectChanges);

// Parameterized & Legacy Aliases
router.get('/entities/:documentId', authenticate, intelligenceController.getEntities);
router.get('/similarity/:documentId', authenticate, intelligenceController.getSimilarDocuments);
router.get('/topics/trends', authenticate, intelligenceController.getTopicTrends);
router.post('/link-evidence/:documentId', authenticate, intelligenceController.linkEvidence);

module.exports = router;
