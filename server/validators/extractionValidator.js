const mongoose = require('mongoose');

const validateRunExtraction = (req) => {
  const errors = [];
  const { documentId } = req.body;

  if (!documentId) {
    errors.push('Field "documentId" is required in request body');
  } else if (!mongoose.Types.ObjectId.isValid(documentId)) {
    errors.push('Invalid "documentId" format: must be a 24-character hex string');
  }

  return errors;
};

const validateRecordUpdate = (req) => {
  const errors = [];
  const { value, unit, parameter, status } = req.body;

  if (status !== undefined) {
    const allowedStatuses = ['pending', 'approved', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      errors.push(`Invalid status. Allowed values: ${allowedStatuses.join(', ')}`);
    }
  }

  if (parameter !== undefined && (typeof parameter !== 'string' || !parameter.trim())) {
    errors.push('Field "parameter" must be a non-empty string');
  }

  return errors;
};

module.exports = {
  validateRunExtraction,
  validateRecordUpdate
};
