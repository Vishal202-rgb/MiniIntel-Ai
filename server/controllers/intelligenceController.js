const intelligenceService = require('../services/intelligenceService');

exports.getEntities = async (req, res) => {
  try {
    const Document = require('../models/Document');
    const doc = await Document.findById(req.params.documentId).select('entities originalName').lean();
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // If entities haven't been extracted yet, do it now
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
    const Document = require('../models/Document');
    const doc = await Document.findById(req.params.documentId)
      .select('similarDocuments originalName')
      .populate('similarDocuments.documentId', 'originalName fileType category')
      .lean();

    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // If similarity hasn't been computed, do it now
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

exports.detectChanges = async (req, res) => {
  try {
    const { docA, docB } = req.query;
    if (!docA || !docB) {
      return res.status(400).json({ error: 'Both docA and docB query parameters are required' });
    }
    const result = await intelligenceService.detectChanges(docA, docB);
    res.json(result);
  } catch (error) {
    console.error('Change detection error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getTopicTrends = async (req, res) => {
  try {
    const trends = await intelligenceService.getTopicTrends();
    res.json(trends);
  } catch (error) {
    console.error('Topic trends error:', error.message);
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
