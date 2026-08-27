const ValidationResult = require('../models/ValidationResult');
const ExtractedRecord = require('../models/ExtractedRecord');

exports.validateDocument = async (documentId) => {
  try {
    const records = await ExtractedRecord.find({ documentId });
    const validationResults = [];

    for (const record of records) {
      // Rule 1: Missing data (value or unit)
      if (!record.value || !record.unit) {
        const result = new ValidationResult({
          documentId,
          recordId: record._id,
          type: 'missing_data',
          severity: 'warning',
          field: !record.value ? 'value' : 'unit',
          message: `Missing ${!record.value ? 'value' : 'unit'} for parameter ${record.parameter}`,
          status: 'open'
        });
        await result.save();
        validationResults.push(result);
      }

      // Rule 2: Invalid value (Production negative)
      if (record.parameter && record.parameter.toLowerCase().includes('production') && record.value) {
        const numValue = parseFloat(record.value);
        if (!isNaN(numValue) && numValue < 0) {
          const result = new ValidationResult({
            documentId,
            recordId: record._id,
            type: 'invalid_value',
            severity: 'error',
            field: 'value',
            message: `Production value cannot be negative: ${record.value}`,
            status: 'open'
          });
          await result.save();
          validationResults.push(result);
        }
      }
    }

    return validationResults;
  } catch (error) {
    console.error('Error validating document:', error);
    throw error;
  }
};
