const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  weight: {
    type: Number,
    default: 1.0,
  },
  keywords: [{
    type: String
  }],
  trendData: [{
    period: { type: String },
    count: { type: Number, default: 0 },
    avgWeight: { type: Number, default: 1.0 }
  }],
  relatedTopics: [{
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    strength: { type: Number, default: 0 }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Topic', TopicSchema);
