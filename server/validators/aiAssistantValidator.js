const mongoose = require('mongoose');

const validateQuery = (req) => {
  const errors = [];
  const text = req.body?.query || req.body?.question;

  if (!text || typeof text !== 'string' || !text.trim()) {
    errors.push('Field "query" or "question" is required and must be a non-empty string');
  }

  const conversationId = req.body?.conversationId;
  if (conversationId && !mongoose.Types.ObjectId.isValid(conversationId)) {
    errors.push('Invalid "conversationId" format: must be a 24-character hex string');
  }

  const topK = req.body?.topK;
  if (topK !== undefined && (typeof topK !== 'number' || topK < 1 || topK > 50)) {
    errors.push('Field "topK" must be an integer between 1 and 50');
  }

  return errors;
};

const validateHistoryId = (req) => {
  const errors = [];
  const id = req.params?.id;

  if (!id) {
    errors.push('Conversation ID parameter ":id" is required');
  } else if (!mongoose.Types.ObjectId.isValid(id)) {
    errors.push('Invalid conversation ID format: must be a 24-character hex string');
  }

  return errors;
};

module.exports = {
  validateQuery,
  validateHistoryId
};
