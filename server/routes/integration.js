const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Document = require('../models/Document');
const ExtractedRecord = require('../models/ExtractedRecord');

// DMS-compatible document listing
router.get('/documents', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, fileType, status, classification, search } = req.query;
    const query = {};
    if (category) query.category = category;
    if (fileType) query.fileType = fileType;
    if (status) query.status = status;
    if (classification) query.classification = classification;
    if (search) query.originalName = { $regex: search, $options: 'i' };

    const docs = await Document.find(query)
      .select('originalName fileType category status classification totalPages uploadedAt gisMetadata entities')
      .sort({ uploadedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Document.countDocuments(query);

    res.json({ success: true, data: docs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// MIS-compatible extracted records
router.get('/records', protect, async (req, res) => {
  try {
    const { page = 1, limit = 50, parameter, period, documentId } = req.query;
    const query = {};
    if (parameter) query.parameter = { $regex: parameter, $options: 'i' };
    if (period) query.period = period;
    if (documentId) query.documentId = documentId;

    const records = await ExtractedRecord.find(query)
      .populate('documentId', 'originalName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await ExtractedRecord.countDocuments(query);

    res.json({ success: true, data: records, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GIS metadata endpoint
router.get('/gis', protect, async (req, res) => {
  try {
    const docs = await Document.find({ 'gisMetadata.latitude': { $exists: true } })
      .select('originalName gisMetadata category status')
      .lean();
    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
