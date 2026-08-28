const Topic = require('../models/Topic');
const DocumentChunk = require('../models/DocumentChunk');
const ExtractedRecord = require('../models/ExtractedRecord');

exports.getTopics = async (req, res, next) => {
  try {
    const defaultTopics = [
      { name: 'Coal Production', description: 'Metrics and trends related to coal extraction and overall production volume.' },
      { name: 'Coal Dispatch', description: 'Logistics, transport, and evacuation of coal from mines to endpoints.' },
      { name: 'Production Targets', description: 'Analysis of actual performance versus planned targets.' },
      { name: 'Production-Dispatch Gap', description: 'Discrepancies between produced and dispatched quantities.' },
      { name: 'Operational Risk', description: 'Potential hazards, delays, or bottlenecks affecting mine operations.' },
      { name: 'Safety', description: 'Safety protocols, incidents, and compliance.' },
      { name: 'Logistics', description: 'Supply chain, transportation infrastructure, and distribution networks.' },
      { name: 'Performance', description: 'Overall mine efficiency, yield, and financial performance.' }
    ];

    const enrichedTopics = await Promise.all(defaultTopics.map(async (topic) => {
      // Find chunks that contain the topic name (case-insensitive)
      const chunkCount = await DocumentChunk.countDocuments({ 
        content: { $regex: topic.name.split(' ')[0], $options: 'i' } 
      });
      
      const recordCount = await ExtractedRecord.countDocuments({
        parameter: { $regex: topic.name.split(' ')[0], $options: 'i' }
      });
      
      return {
        _id: topic.name.toLowerCase().replace(/\s+/g, '-'),
        name: topic.name,
        description: topic.description,
        documentCount: chunkCount + recordCount,
        relevanceScore: Math.min(0.99, (chunkCount + recordCount) * 0.05 + 0.5)
      };
    }));
    
    // Sort by relevance/count
    enrichedTopics.sort((a, b) => b.documentCount - a.documentCount);

    res.status(200).json({ success: true, data: enrichedTopics });
  } catch (error) {
    next(error);
  }
};

exports.extractTopics = async (req, res, next) => {
  res.status(200).json({ success: true, data: [] });
};
