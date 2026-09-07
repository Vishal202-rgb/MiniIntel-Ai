const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  sources: {
    type: [Object],
    default: []
  },
  confidence: {
    type: Number,
    default: 0
  },
  citations: {
    type: [Object],
    default: []
  },
  evidence: {
    type: [Object],
    default: []
  },
  calculation: {
    type: Object,
    default: {}
  },
  insufficientEvidence: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'New Conversation'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  messages: {
    type: [messageSchema],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
