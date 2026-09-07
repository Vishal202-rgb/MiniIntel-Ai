const aiAssistantService = require('../services/aiAssistantService');
const Conversation = require('../models/Conversation');
const AuditLog = require('../models/AuditLog');

/**
 * REST v1: Query or ask AI Assistant
 * POST /api/v1/ai-assistant/query
 * POST /api/v1/ai-assistant/ask
 */
const queryOrAsk = async (req, res, next) => {
  try {
    const question = req.body.query || req.body.question;
    const { conversationId, topK, filters } = req.body;

    const result = await aiAssistantService.processQuestion(question, conversationId, {
      user: req.user,
      topK,
      filters
    });

    // Record audit entry
    try {
      const audit = new AuditLog({
        user: req.user?._id,
        action: 'AI_ASSISTANT_QUERY',
        resource: 'AIAssistant',
        details: `Query: ${question.substring(0, 80)}`,
        status: 'SUCCESS'
      });
      await audit.save();
    } catch (auditErr) {
      console.warn('Audit log write failed:', auditErr.message);
    }

    return res.status(200).json({
      success: true,
      data: {
        answer: result.answer,
        confidence: result.confidence,
        citations: result.citations || [],
        evidence: result.evidence || [],
        calculation: result.calculation || {},
        insufficientEvidence: result.insufficientEvidence || false,
        conversationId: result.conversationId
      },
      message: 'Query processed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * REST v1: Get conversation history list
 * GET /api/v1/ai-assistant/history
 */
const getHistory = async (req, res, next) => {
  try {
    const query = {};
    if (req.user && req.user.role !== 'admin') {
      // Non-admins see their own conversations or legacy unassigned ones
      query.$or = [{ user: req.user._id }, { user: { $exists: false } }, { user: null }];
    }

    const conversations = await Conversation.find(query)
      .select('_id title user createdAt updatedAt messages')
      .sort({ updatedAt: -1 });

    const formatted = conversations.map(c => ({
      id: c._id,
      title: c.title,
      messageCount: c.messages ? c.messages.length : 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
      message: 'Conversation history retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * REST v1: Get conversation history by ID
 * GET /api/v1/ai-assistant/history/:id
 */
const getHistoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation history not found'
      });
    }

    // Ownership check for non-admins
    if (conversation.user && req.user && req.user.role !== 'admin' && conversation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view this conversation'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: conversation._id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messages: conversation.messages || []
      },
      message: 'Conversation retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * REST v1: Delete conversation history by ID
 * DELETE /api/v1/ai-assistant/history/:id
 */
const deleteHistoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation history not found'
      });
    }

    // Ownership check for non-admins
    if (conversation.user && req.user && req.user.role !== 'admin' && conversation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to delete this conversation'
      });
    }

    await Conversation.findByIdAndDelete(id);

    try {
      const audit = new AuditLog({
        user: req.user?._id,
        action: 'DELETE_CONVERSATION_HISTORY',
        resource: 'AIAssistant',
        details: `Deleted conversation ${id}`,
        status: 'SUCCESS'
      });
      await audit.save();
    } catch (auditErr) {
      console.warn('Audit log write failed:', auditErr.message);
    }

    return res.status(200).json({
      success: true,
      data: { id },
      message: 'Conversation history deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// LEGACY COMPATIBILITY METHODS
// Preserved for /api/ai-assistant & React UI
// ==========================================

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
  // REST v1
  queryOrAsk,
  getHistory,
  getHistoryById,
  deleteHistoryById,
  // Legacy
  askQuestion,
  getConversations,
  getConversation
};
