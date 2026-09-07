const mongoose = require('mongoose');

/**
 * Request validators for Audit endpoints
 */

const validateAuditId = (req) => {
  const errors = [];
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    errors.push('Invalid audit log ID format');
  }
  return errors;
};

const validateUserId = (req) => {
  const errors = [];
  const { userId } = req.params;
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    errors.push('Invalid user ID format');
  }
  return errors;
};

const validateDocumentId = (req) => {
  const errors = [];
  const { documentId } = req.params;
  if (!documentId || !mongoose.Types.ObjectId.isValid(documentId)) {
    errors.push('Invalid document ID format');
  }
  return errors;
};

const validateReportId = (req) => {
  const errors = [];
  const { reportId } = req.params;
  if (!reportId || !mongoose.Types.ObjectId.isValid(reportId)) {
    errors.push('Invalid report ID format');
  }
  return errors;
};

module.exports = {
  validateAuditId,
  validateUserId,
  validateDocumentId,
  validateReportId
};
