const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileType: { 
    type: String, 
    enum: ['pdf', 'docx', 'xlsx', 'csv', 'image'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed', 'extracted'], 
    default: 'pending' 
  },
  totalPages: { type: Number, default: 0 },
  extractedText: { type: String, default: '' },
  error: { type: String, default: '' },
  uploadedAt: { type: Date, default: Date.now },
  processedAt: Date
});

documentSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

documentSchema.set('toJSON', { virtuals: true });
documentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Document', documentSchema);
