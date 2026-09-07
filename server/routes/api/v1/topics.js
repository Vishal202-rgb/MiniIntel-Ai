const express = require('express');
const router = express.Router();
const topicController = require('../../../controllers/topicController');
const { authenticate } = require('../../../middleware/auth');

// REST v1 Topics Endpoints
router.get('/', authenticate, topicController.getTopics);
router.post('/analyze', authenticate, topicController.analyzeTopics);
router.get('/trends', authenticate, topicController.getTopicTrends);
router.get('/clusters', authenticate, topicController.getTopicClusters);
router.get('/entities', authenticate, topicController.getTopicEntities);
router.get('/emerging', authenticate, topicController.getEmergingTopics);
router.get('/changes', authenticate, topicController.getTopicChanges);

// Legacy stub alias
router.post('/extract', authenticate, topicController.extractTopics);

module.exports = router;
