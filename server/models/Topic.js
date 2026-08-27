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
  }]
}, { timestamps: true });

module.exports = mongoose.model('Topic', TopicSchema);
