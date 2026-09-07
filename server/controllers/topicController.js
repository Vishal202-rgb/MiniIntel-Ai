const Topic = require('../models/Topic');
const DocumentChunk = require('../models/DocumentChunk');
const ExtractedRecord = require('../models/ExtractedRecord');
const Document = require('../models/Document');
const intelligenceService = require('../services/intelligenceService');

/**
 * REST v1 & Legacy: GET /api/v1/topics
 */
exports.getTopics = async (req, res, next) => {
  try {
    const dbTopics = await Topic.find({}).lean();

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

    // Combine DB topics and default mining taxonomy
    const allTopics = [...dbTopics];
    defaultTopics.forEach(dt => {
      if (!allTopics.some(t => t.name.toLowerCase() === dt.name.toLowerCase())) {
        allTopics.push({
          name: dt.name,
          description: dt.description,
          keywords: dt.name.toLowerCase().split(' '),
          weight: 0.8
        });
      }
    });

    const enrichedTopics = await Promise.all(allTopics.map(async (topic) => {
      const kw = topic.name.split(' ')[0];
      const chunkCount = await DocumentChunk.countDocuments({ 
        content: { $regex: kw, $options: 'i' } 
      });
      
      const recordCount = await ExtractedRecord.countDocuments({
        parameter: { $regex: kw, $options: 'i' }
      });

      const docCount = (topic.documents && topic.documents.length) 
        ? topic.documents.length 
        : (chunkCount > 0 ? 1 : 0);
      
      return {
        _id: topic._id || topic.name.toLowerCase().replace(/\s+/g, '-'),
        name: topic.name,
        description: topic.description || `Analysis of ${topic.name} within mining reports.`,
        keywords: topic.keywords || [kw.toLowerCase()],
        weight: topic.weight || 0.8,
        documentCount: docCount,
        mentionCount: chunkCount + recordCount,
        relevanceScore: Math.min(0.99, Number(((chunkCount + recordCount) * 0.04 + 0.6).toFixed(2)))
      };
    }));
    
    enrichedTopics.sort((a, b) => b.mentionCount - a.mentionCount);

    res.status(200).json({
      success: true,
      data: enrichedTopics,
      message: 'Topics retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * REST v1: POST /api/v1/topics/analyze
 */
exports.analyzeTopics = async (req, res, next) => {
  try {
    const documentId = req.body?.documentId || req.query?.documentId;
    let targetDocId = documentId;

    if (!targetDocId) {
      const doc = await Document.findOne({ status: { $in: ['completed', 'extracted'] } }).sort({ uploadedAt: -1 });
      targetDocId = doc?._id;
    }

    if (!targetDocId) {
      return res.status(200).json({
        success: true,
        data: { topicsFound: 0, topics: [] },
        message: 'No documents available for topic analysis'
      });
    }

    const createdIds = await intelligenceService.discoverTopics(targetDocId);
    const discovered = await Topic.find({ _id: { $in: createdIds } }).lean();

    res.status(200).json({
      success: true,
      data: {
        documentId: targetDocId,
        topicsFound: discovered.length,
        topics: discovered
      },
      message: 'Topic analysis completed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * REST v1: GET /api/v1/topics/trends
 */
exports.getTopicTrends = async (req, res, next) => {
  try {
    const topics = await Topic.find({ 'trendData.0': { $exists: true } }).lean();
    
    const trends = topics.map(t => ({
      id: t._id,
      name: t.name,
      weight: t.weight,
      periods: t.trendData.sort((a, b) => (a.period || '').localeCompare(b.period || ''))
    }));

    res.status(200).json({
      success: true,
      data: trends,
      message: 'Topic temporal trends retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * REST v1: GET /api/v1/topics/clusters
 */
exports.getTopicClusters = async (req, res, next) => {
  try {
    const topics = await Topic.find({}).populate('relatedTopics.topicId', 'name weight').lean();

    const clusters = topics.map((t, idx) => ({
      clusterId: `cluster_${idx + 1}`,
      name: t.name,
      weight: t.weight,
      keywords: t.keywords || [],
      documentsCount: (t.documents || []).length,
      relatedTopics: (t.relatedTopics || []).map(r => ({
        name: r.topicId?.name || 'Related Topic',
        strength: r.strength
      }))
    }));

    res.status(200).json({
      success: true,
      data: clusters,
      message: 'Topic clusters retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * REST v1: GET /api/v1/topics/entities
 */
exports.getTopicEntities = async (req, res, next) => {
  try {
    const topics = await Topic.find({}).populate('documents', 'originalName entities').lean();

    const topicEntities = topics.map(t => {
      const entityMap = new Map();
      (t.documents || []).forEach(doc => {
        (doc.entities || []).forEach(e => {
          const key = `${e.name}_${e.type}`;
          if (!entityMap.has(key)) {
            entityMap.set(key, { name: e.name, type: e.type, mentions: e.mentions || 1 });
          } else {
            entityMap.get(key).mentions += (e.mentions || 1);
          }
        });
      });

      return {
        topicId: t._id,
        topicName: t.name,
        entitiesCount: entityMap.size,
        entities: Array.from(entityMap.values()).slice(0, 10)
      };
    });

    res.status(200).json({
      success: true,
      data: topicEntities,
      message: 'Topic-entity associations retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * REST v1: GET /api/v1/topics/emerging
 */
exports.getEmergingTopics = async (req, res, next) => {
  try {
    const topics = await Topic.find({}).lean();

    // Identify emerging topics: topics with high weight or appearing in newest periods
    const emerging = topics.map(t => {
      const trendData = t.trendData || [];
      const latestTrend = trendData[trendData.length - 1];
      const growthRate = trendData.length > 1 
        ? Number((((latestTrend?.count || 1) - (trendData[0]?.count || 1)) / (trendData[0]?.count || 1) * 100).toFixed(1))
        : 0;

      return {
        topicId: t._id,
        name: t.name,
        weight: t.weight,
        growthRate,
        latestPeriod: latestTrend?.period || 'Recent',
        status: growthRate > 0 ? 'ACCELERATING' : 'EMERGING'
      };
    }).sort((a, b) => b.growthRate - a.growthRate);

    res.status(200).json({
      success: true,
      data: emerging,
      message: 'Emerging topics identified successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * REST v1: GET /api/v1/topics/changes
 */
exports.getTopicChanges = async (req, res, next) => {
  try {
    const topics = await Topic.find({ 'trendData.1': { $exists: true } }).lean();

    const changes = topics.map(t => {
      const periods = t.trendData || [];
      const prev = periods[periods.length - 2];
      const curr = periods[periods.length - 1];

      const countDiff = (curr?.count || 0) - (prev?.count || 0);
      const weightDiff = Number(((curr?.avgWeight || 0) - (prev?.avgWeight || 0)).toFixed(2));

      return {
        topicId: t._id,
        name: t.name,
        fromPeriod: prev?.period || 'Previous',
        toPeriod: curr?.period || 'Current',
        countChange: countDiff,
        weightChange: weightDiff,
        direction: countDiff >= 0 ? 'EXPANDING' : 'CONTRACTING'
      };
    });

    res.status(200).json({
      success: true,
      data: changes,
      message: 'Topic changes across periods retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Legacy stub preserved for /api/topics/extract
exports.extractTopics = async (req, res, next) => {
  res.status(200).json({ success: true, data: [] });
};
