const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true },
  content: { type: mongoose.Schema.Types.Mixed },
  status: {
    type: String,
    enum: ['draft', 'review', 'approved', 'rejected'],
    default: 'draft'
  },
  fileUrl: { type: String },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewerComments: { type: String, default: '' },
  reviewedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  version: { type: Number, default: 1 },
  previousVersions: [{
    content: { type: mongoose.Schema.Types.Mixed },
    version: { type: Number },
    date: { type: Date, default: Date.now }
  }],
  confidenceScore: { type: Number, default: 0 },
  evidenceCoverage: {
    total: { type: Number, default: 0 },
    cited: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  },
  language: { type: String, default: 'en' }
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);
