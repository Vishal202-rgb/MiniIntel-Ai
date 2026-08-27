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
  messages: {
    type: [messageSchema],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
