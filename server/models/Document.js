const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileType: { 
    type: String, 
    enum: ['pdf', 'docx', 'xlsx', 'csv', 'image', 'pptx'], 
    required: true 
  },
  hash: { type: String },
  category: { type: String, default: 'Uncategorized' },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed', 'extracted'], 
    default: 'pending' 
  },
  totalPages: { type: Number, default: 0 },
  extractedText: { type: String, default: '' },
  error: { type: String, default: '' },
  entities: [{
    name: { type: String },
    type: { type: String, enum: ['Mine', 'Subsidiary', 'Location', 'Equipment', 'Project', 'Person', 'Organization', 'Other'] },
    mentions: { type: Number, default: 1 }
  }],
  topicIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
  similarDocuments: [{
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    score: { type: Number }
  }],
  uploadedAt: { type: Date, default: Date.now },
  processedAt: Date,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

documentSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

documentSchema.set('toJSON', { virtuals: true });
documentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Document', documentSchema);
