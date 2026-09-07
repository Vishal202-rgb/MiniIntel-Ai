const mongoose = require('mongoose');

const validateRunValidation = (req) => {
  const errors = [];
  const documentId = req.body?.documentId || req.query?.documentId;

  if (!documentId) {
    errors.push('Field "documentId" is required');
  } else if (!mongoose.Types.ObjectId.isValid(documentId)) {
    errors.push('Invalid "documentId" format: must be a 24-character hex string');
  }

  return errors;
};

const validateIssueUpdate = (req) => {
  const errors = [];
  const { status } = req.body;

  if (status !== undefined) {
    const allowedStatuses = ['open', 'resolved', 'ignored'];
    if (!allowedStatuses.includes(status)) {
      errors.push(`Invalid status. Allowed values: ${allowedStatuses.join(', ')}`);
    }
  }

  return errors;
};

const validateDocumentReview = (req) => {
  const errors = [];
  const decision = req.body?.decision || req.body?.status;

  if (decision !== undefined) {
    const allowedDecisions = ['approved', 'rejected', 'needs_correction', 'in_review'];
    if (!allowedDecisions.includes(decision)) {
      errors.push(`Invalid decision/status. Allowed values: ${allowedDecisions.join(', ')}`);
    }
  }

  return errors;
};

module.exports = {
  validateRunValidation,
  validateIssueUpdate,
  validateDocumentReview
};
