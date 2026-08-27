const mongoose = require('mongoose');

const ExtractedRecordSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  pageNumber: {
    type: Number
  },
  parameter: {
    type: String,
    required: true
  },
  value: {
    type: String
  },
  unit: {
    type: String
  },
  period: {
    type: String
  },
  mineName: {
    type: String
  },
  subsidiary: {
    type: String
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 1
  },
  sourceText: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  originalValue: {
    type: String
  },
  editHistory: [{
    field: String,
    oldValue: String,
    newValue: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: String // Alternatively, an ObjectId for a User schema
  }
}, { timestamps: true });

module.exports = mongoose.model('ExtractedRecord', ExtractedRecordSchema);
