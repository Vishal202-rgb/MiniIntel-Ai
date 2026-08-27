const mongoose = require('mongoose');

const processingJobSchema = new mongoose.Schema({
  documentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Document', 
    required: true, 
    index: true 
  },
  status: { 
    type: String, 
    enum: ['queued', 'processing', 'completed', 'failed'], 
    default: 'queued' 
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  currentStep: { type: String, default: '' },
  steps: [{ 
    name: String, 
    status: { 
      type: String, 
      enum: ['pending', 'processing', 'completed', 'failed'], 
      default: 'pending' 
    } 
  }],
  startedAt: Date,
  completedAt: Date,
  error: { type: String, default: '' }
});

module.exports = mongoose.model('ProcessingJob', processingJobSchema);
