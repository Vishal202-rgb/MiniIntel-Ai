const mongoose = require('mongoose');

const validateIndexDocument = (req) => {
  const errors = [];
  const documentId = req.body?.documentId || req.params?.documentId;

  if (!documentId) {
    errors.push('Field "documentId" is required');
  } else if (!mongoose.Types.ObjectId.isValid(documentId)) {
    errors.push('Invalid "documentId" format: must be a 24-character hex string');
  }

  return errors;
};

const validateSearchKnowledgeBase = (req) => {
  const errors = [];
  const query = req.body?.query;

  if (!query || typeof query !== 'string' || !query.trim()) {
    errors.push('Field "query" is required and must be a non-empty string');
  }

  return errors;
};

module.exports = {
  validateIndexDocument,
  validateSearchKnowledgeBase
};
