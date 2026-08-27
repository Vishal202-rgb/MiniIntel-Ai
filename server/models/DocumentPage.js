const mongoose = require('mongoose');

const documentPageSchema = new mongoose.Schema({
  documentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Document', 
    required: true, 
    index: true 
  },
  pageNumber: { type: Number, required: true },
  content: { type: String, default: '' },
  wordCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('DocumentPage', documentPageSchema);
