const mongoose = require('mongoose');

const documentChunkSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    index: true,
    required: true
  },
  pageNumber: {
    type: Number,
    required: true
  },
  chunkIndex: {
    type: Number,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number]
  },
  metadata: {
    type: Object,
    default: {}
  },
  recordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExtractedRecord'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DocumentChunk', documentChunkSchema);
