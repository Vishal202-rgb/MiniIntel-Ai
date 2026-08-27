const aiAssistantService = require('../services/aiAssistantService');
const Conversation = require('../models/Conversation');

const askQuestion = async (req, res) => {
  try {
    const { question, conversationId } = req.body;
    
    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }
    
    const result = await aiAssistantService.processQuestion(question, conversationId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error processing question', error: error.message });
  }
};

const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .select('_id title createdAt updatedAt')
      .sort({ updatedAt: -1 });
      
    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
};

const getConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findById(id);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversation', error: error.message });
  }
};

module.exports = {
  askQuestion,
  getConversations,
  getConversation
};
