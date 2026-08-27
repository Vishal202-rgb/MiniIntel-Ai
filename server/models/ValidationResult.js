const mongoose = require('mongoose');

const ValidationResultSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  recordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExtractedRecord'
  },
  type: {
    type: String,
    enum: ['missing_data', 'duplicate', 'conflict', 'unit_mismatch', 'invalid_value', 'suspicious_value', 'cross_document_mismatch'],
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    required: true
  },
  field: {
    type: String
  },
  message: {
    type: String,
    required: true
  },
  details: {
    type: Object
  },
  status: {
    type: String,
    enum: ['open', 'resolved', 'ignored'],
    default: 'open'
  },
  resolution: {
    type: String
  },
  resolvedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('ValidationResult', ValidationResultSchema);
