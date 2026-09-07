const mongoose = require('mongoose');

/**
 * Request validators for report operations
 */

const validateGenerateReport = (req) => {
  const errors = [];
  const { type } = req.body;

  if (!type || typeof type !== 'string' || !type.trim()) {
    errors.push('Field "type" is required for report generation');
  }

  return errors;
};

const validateUpdateReport = (req) => {
  const errors = [];
  const { title, content, markdown, language } = req.body;

  if (!title && !content && !markdown && !language) {
    errors.push('At least one of "title", "content", "markdown", or "language" must be provided for update');
  }

  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    errors.push('"title" must be a non-empty string');
  }

  return errors;
};

const validateRejectReport = (req) => {
  const errors = [];
  const reason = req.body.comments || req.body.reason;

  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    errors.push('A non-empty rejection reason or comment is required');
  }

  return errors;
};

const validateReportId = (req) => {
  const errors = [];
  const id = req.params.id;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    errors.push('Invalid report ID format');
  }

  return errors;
};

module.exports = {
  validateGenerateReport,
  validateUpdateReport,
  validateRejectReport,
  validateReportId
};
