const intelligenceService = require('../services/intelligenceService');
const Document = require('../models/Document');

/**
 * REST v1: GET /api/v1/intelligence
 */
exports.getIntelligenceOverview = async (req, res, next) => {
  try {
    const data = await intelligenceService.getIntelligenceSummary(req.user, req.query);
    res.status(200).json({
      success: true,
      data,
      message: 'Intelligence overview retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * REST v1: POST /api/v1/intelligence/analyze
 */
exports.analyzeIntelligence = async (req, res, next) => {
  try {
    const documentId = req.body?.documentId || req.query?.documentId;
    
    if (documentId) {
      const doc = await Document.findById(documentId);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }

      const [entities, topics, similar] = await Promise.all([
        intelligenceService.extractEntities(documentId),
        intelligenceService.discoverTopics(documentId),
        intelligenceService.computeDocumentSimilarity(documentId)
      ]);

      return res.status(200).json({
        success: true,
        data: {
          documentId,
          documentName: doc.originalName || doc.filename,
          entitiesExtracted: entities.length,
          topicsExtracted: topics.length,
          similarDocumentsFound: similar.length
        },
        message: 'Document intelligence analysis completed successfully'
      });
    }

    // If no documentId specified, analyze latest available document
    const latestDoc = await Document.findOne({ status: { $in: ['completed', 'extracted'] } }).sort({ uploadedAt: -1 });
    if (!latestDoc) {
      return res.status(200).json({
        success: true,
        data: { message: 'No documents available for analysis' },
        message: 'Analysis completed'
      });
    }

    const [entities, topics, similar] = await Promise.all([
      intelligenceService.extractEntities(latestDoc._id),
      intelligenceService.discoverTopics(latestDoc._id),
      intelligenceService.computeDocumentSimilarity(latestDoc._id)
    ]);

    res.status(200).json({
      success: true,
      data: {
        documentId: latestDoc._id,
        documentName: latestDoc.originalName || latestDoc.filename,
        entitiesExtracted: entities.length,
        topicsExtracted: topics.length,
        similarDocumentsFound: similar.length
      },
      message: 'Intelligence analysis completed for latest document'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * REST v1 & Legacy: GET /api/v1/intelligence/trends or /api/intelligence/topics/trends
 */
exports.getTopicTrends = async (req, res, next) => {
  try {
    const trends = await intelligenceService.getTopicTrends();
    if (req.baseUrl.startsWith('/api/v1') || req.originalUrl.startsWith('/api/v1')) {
      return res.status(200).json({
        success: true,
        data: trends,
        message: 'Topic intelligence trends retrieved successfully'
      });
    }
    // Legacy un-enveloped format for React UI IntelligenceDashboard.jsx
    return res.status(200).json(trends);
  } catch (error) {
    if (req.baseUrl.startsWith('/api/v1') || req.originalUrl.startsWith('/api/v1')) {
      return next(error);
    }
    return res.status(500).json({ error: error.message });
  }
};

/**
 * REST v1: GET /api/v1/intelligence/entities
 */
exports.getAllEntities = async (req, res, next) => {
  try {
    const data = await intelligenceService.getAllEntities(req.user, req.query);
    res.status(200).json({
      success: true,
      data,
      message: 'Named entities retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * REST v1: GET /api/v1/intelligence/clusters
 */
exports.getClusters = async (req, res, next) => {
  try {
    const data = await intelligenceService.getClusters(req.user, req.query);
    res.status(200).json({
      success: true,
      data,
      message: 'Intelligence clusters retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * REST v1: GET /api/v1/intelligence/similarity
 */
exports.getSimilarity = async (req, res, next) => {
  try {
    const documentId = req.query.document || req.query.documentId;
    const data = await intelligenceService.getSimilarityMatrix(req.user, { document: documentId });
    res.status(200).json({
      success: true,
      data,
      message: 'Document similarity retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * REST v1 & Legacy: GET /api/v1/intelligence/changes
 */
exports.detectChanges = async (req, res, next) => {
  try {
    let { docA, docB } = req.query;

    if (!docA || !docB) {
      // Pick two documents with records if not specified
      const docs = await Document.find({ status: { $in: ['completed', 'extracted'] } })
        .sort({ uploadedAt: -1 })
        .limit(2)
        .select('_id');

      if (docs.length < 2) {
        return res.status(200).json({
          success: true,
          data: {
            totalChanges: 0,
            added: 0,
            removed: 0,
            modified: 0,
            changes: [],
            note: 'Insufficient documents to compute automatic diff. Provide docA and docB.'
          },
          message: 'Change detection executed'
        });
      }

      docA = String(docs[1]._id);
      docB = String(docs[0]._id);
    }

    const result = await intelligenceService.detectChanges(docA, docB);
    res.status(200).json({
      success: true,
      data: result,
      message: 'Document changes detected successfully'
    });
  } catch (error) {
    next(error);
  }
};

// =============================================
// LEGACY COMPATIBILITY HANDLERS
// Preserved for /api/intelligence & React UI
// =============================================

exports.getEntities = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.documentId).select('entities originalName').lean();
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (!doc.entities || doc.entities.length === 0) {
      const entities = await intelligenceService.extractEntities(req.params.documentId);
      return res.json({ documentName: doc.originalName, entities });
    }

    res.json({ documentName: doc.originalName, entities: doc.entities });
  } catch (error) {
    console.error('Get entities error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getSimilarDocuments = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.documentId)
      .select('similarDocuments originalName')
      .populate('similarDocuments.documentId', 'originalName fileType category')
      .lean();

    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (!doc.similarDocuments || doc.similarDocuments.length === 0) {
      const results = await intelligenceService.computeDocumentSimilarity(req.params.documentId);
      return res.json({ documentName: doc.originalName, similar: results });
    }

    res.json({ documentName: doc.originalName, similar: doc.similarDocuments });
  } catch (error) {
    console.error('Similarity error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.linkEvidence = async (req, res) => {
  try {
    const linked = await intelligenceService.linkEvidence(req.params.documentId);
    res.json({ documentId: req.params.documentId, linked });
  } catch (error) {
    console.error('Evidence linking error:', error.message);
    res.status(500).json({ error: error.message });
  }
};
