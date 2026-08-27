const express = require('express');
const router = express.Router();
const aiAssistantController = require('../controllers/aiAssistantController');

router.post('/ask', aiAssistantController.askQuestion);
router.get('/conversations', aiAssistantController.getConversations);
router.get('/conversations/:id', aiAssistantController.getConversation);

module.exports = router;
