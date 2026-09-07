const mongoose = require('mongoose');

const validateObjectId = (id, paramName = 'ID') => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return `Invalid ${paramName} format: must be a 24-character hex string`;
  }
  return null;
};

const validateDocumentMetadataUpdate = (req) => {
  const errors = [];
  const { category, classification, gisMetadata, retentionDate } = req.body;

  if (classification !== undefined) {
    const validClassifications = ['public', 'internal', 'confidential', 'restricted'];
    if (!validClassifications.includes(classification)) {
      errors.push(`Invalid classification. Allowed values: ${validClassifications.join(', ')}`);
    }
  }

  if (category !== undefined && typeof category !== 'string') {
    errors.push('Category must be a string');
  }

  if (gisMetadata !== undefined) {
    if (typeof gisMetadata !== 'object' || gisMetadata === null) {
      errors.push('gisMetadata must be an object');
    } else {
      if (gisMetadata.latitude !== undefined && isNaN(parseFloat(gisMetadata.latitude))) {
        errors.push('gisMetadata.latitude must be a valid number');
      }
      if (gisMetadata.longitude !== undefined && isNaN(parseFloat(gisMetadata.longitude))) {
        errors.push('gisMetadata.longitude must be a valid number');
      }
    }
  }

  if (retentionDate !== undefined && retentionDate !== null) {
    if (isNaN(new Date(retentionDate).getTime())) {
      errors.push('retentionDate must be a valid ISO Date string');
    }
  }

  return errors;
};

module.exports = {
  validateObjectId,
  validateDocumentMetadataUpdate
};
