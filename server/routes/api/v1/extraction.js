const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const extractionService = require('../../../services/extractionService');
const ExtractedRecord = require('../../../models/ExtractedRecord');
const Document = require('../../../models/Document');
const { authenticate } = require('../../../middleware/auth');
const { sendSuccess, sendError } = require('../../../utils/apiResponse');
const validate = require('../../../validators/validate');
const { validateRunExtraction, validateRecordUpdate } = require('../../../validators/extractionValidator');

// Helper: Check valid ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper: Check document access authorization
const checkDocumentAccess = async (documentId, user) => {
  if (!isValidId(documentId)) {
    return { error: 'Invalid document ID format', code: 'INVALID_ID', status: 400 };
  }

  const document = await Document.findById(documentId);
  if (!document) {
    return { error: 'Document not found', code: 'DOCUMENT_NOT_FOUND', status: 404 };
  }

  if (user.role !== 'admin' && document.userId && document.userId.toString() !== user._id.toString()) {
    return { error: 'Access denied: not authorized to access this document', code: 'FORBIDDEN', status: 403 };
  }

  return { document };
};

/**
 * @route   POST /api/v1/extraction/run
 * @desc    Trigger AI data extraction for a document
 * @access  Private
 */
router.post('/run', authenticate, validate(validateRunExtraction), async (req, res, next) => {
  try {
    const { documentId } = req.body;

    const access = await checkDocumentAccess(documentId, req.user);
    if (access.error) {
      return sendError(res, access.error, access.code, access.status);
    }

    const records = await extractionService.extractFromDocument(documentId);

    return sendSuccess(
      res,
      {
        documentId,
        count: records.length,
        records
      },
      'Extraction completed successfully',
      200
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/extraction/:documentId
 * @desc    Get extraction summary and status for a document
 * @access  Private
 */
router.get('/:documentId', authenticate, async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const access = await checkDocumentAccess(documentId, req.user);
    if (access.error) {
      return sendError(res, access.error, access.code, access.status);
    }

    const records = await ExtractedRecord.find({ documentId }).sort({ pageNumber: 1, createdAt: 1 });

    const total = records.length;
    let approved = 0;
    let pending = 0;
    let rejected = 0;
    let confidenceSum = 0;
    const paramSet = new Set();

    records.forEach(r => {
      if (r.status === 'approved') approved++;
      else if (r.status === 'rejected') rejected++;
      else pending++;

      if (typeof r.confidenceScore === 'number') {
        confidenceSum += r.confidenceScore;
      }
      if (r.parameter) {
        paramSet.add(r.parameter);
      }
    });

    const avgConfidence = total > 0 ? +(confidenceSum / total).toFixed(2) : 0;

    const summary = {
      total,
      approved,
      pending,
      rejected,
      avgConfidence,
      parameters: Array.from(paramSet)
    };

    return sendSuccess(
      res,
      {
        documentId,
        summary,
        records
      },
      'Extraction summary retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/extraction/:documentId/records
 * @desc    Get extracted records for a document with filtering and pagination
 * @access  Private
 */
router.get('/:documentId/records', authenticate, async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { status, parameter, mineName, page = 1, limit = 50 } = req.query;

    const access = await checkDocumentAccess(documentId, req.user);
    if (access.error) {
      return sendError(res, access.error, access.code, access.status);
    }

    const query = { documentId };

    if (status) {
      query.status = status;
    }
    if (parameter) {
      query.parameter = { $regex: parameter, $options: 'i' };
    }
    if (mineName) {
      query.mineName = { $regex: mineName, $options: 'i' };
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [records, total] = await Promise.all([
      ExtractedRecord.find(query)
        .sort({ pageNumber: 1, createdAt: 1 })
        .skip(skip)
        .limit(limitNum),
      ExtractedRecord.countDocuments(query)
    ]);

    return sendSuccess(res, records, 'Extracted records retrieved successfully', 200, {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/extraction/:documentId/records/:recordId
 * @desc    Update an extracted record (value, unit, status, etc.) with audit history
 * @access  Private
 */
router.put('/:documentId/records/:recordId', authenticate, validate(validateRecordUpdate), async (req, res, next) => {
  try {
    const { documentId, recordId } = req.params;

    const access = await checkDocumentAccess(documentId, req.user);
    if (access.error) {
      return sendError(res, access.error, access.code, access.status);
    }

    if (!isValidId(recordId)) {
      return sendError(res, 'Invalid record ID format', 'INVALID_ID', 400);
    }

    const record = await ExtractedRecord.findOne({ _id: recordId, documentId });
    if (!record) {
      return sendError(res, 'Extracted record not found for this document', 'RECORD_NOT_FOUND', 404);
    }

    const { value, unit, parameter, status, period, mineName, subsidiary } = req.body;

    // Track original value if not already set
    if (!record.originalValue && record.value !== undefined) {
      record.originalValue = record.value;
    }

    // Value update
    if (value !== undefined && value !== record.value) {
      record.editHistory.push({
        field: 'value',
        oldValue: record.value,
        newValue: value,
        editedAt: new Date()
      });
      record.value = value;
    }

    // Unit update
    if (unit !== undefined && unit !== record.unit) {
      record.editHistory.push({
        field: 'unit',
        oldValue: record.unit,
        newValue: unit,
        editedAt: new Date()
      });
      record.unit = unit;
    }

    // Parameter update
    if (parameter !== undefined && parameter !== record.parameter) {
      record.editHistory.push({
        field: 'parameter',
        oldValue: record.parameter,
        newValue: parameter,
        editedAt: new Date()
      });
      record.parameter = parameter;
    }

    // Status update
    if (status !== undefined) {
      record.status = status;
      record.reviewedAt = new Date();
      record.reviewedBy = req.user.username || req.user.email || req.user._id.toString();
    }

    if (period !== undefined) record.period = period;
    if (mineName !== undefined) record.mineName = mineName;
    if (subsidiary !== undefined) record.subsidiary = subsidiary;

    await record.save();

    return sendSuccess(res, record, 'Extracted record updated successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/extraction/:documentId/reprocess
 * @desc    Re-trigger AI data extraction for a document (clears previous extractions)
 * @access  Private
 */
router.post('/:documentId/reprocess', authenticate, async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const access = await checkDocumentAccess(documentId, req.user);
    if (access.error) {
      return sendError(res, access.error, access.code, access.status);
    }

    const records = await extractionService.extractFromDocument(documentId);

    return sendSuccess(
      res,
      {
        documentId,
        count: records.length,
        records
      },
      'Document re-extraction completed successfully',
      200
    );
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// Backward-compatible route aliases within v1 namespace
// =========================================================================

// POST /api/v1/extraction/:documentId/extract -> alias for reprocess
router.post('/:documentId/extract', authenticate, async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const access = await checkDocumentAccess(documentId, req.user);
    if (access.error) {
      return sendError(res, access.error, access.code, access.status);
    }
    const records = await extractionService.extractFromDocument(documentId);
    return sendSuccess(res, { count: records.length, records }, 'Extraction completed');
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/extraction/records/:id -> legacy single record update
router.put('/records/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return sendError(res, 'Invalid record ID format', 'INVALID_ID', 400);
    }

    const record = await ExtractedRecord.findById(id);
    if (!record) {
      return sendError(res, 'Record not found', 'RECORD_NOT_FOUND', 404);
    }

    const access = await checkDocumentAccess(record.documentId, req.user);
    if (access.error) {
      return sendError(res, access.error, access.code, access.status);
    }

    const { value, unit } = req.body;
    if (value !== undefined && value !== record.value) {
      record.editHistory.push({ field: 'value', oldValue: record.value, newValue: value, editedAt: new Date() });
      record.value = value;
    }
    if (unit !== undefined && unit !== record.unit) {
      record.editHistory.push({ field: 'unit', oldValue: record.unit, newValue: unit, editedAt: new Date() });
      record.unit = unit;
    }

    await record.save();
    return sendSuccess(res, record, 'Record updated successfully');
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/extraction/records/:id/approve
router.post('/records/:id/approve', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return sendError(res, 'Invalid record ID format', 'INVALID_ID', 400);
    }

    const record = await ExtractedRecord.findById(id);
    if (!record) {
      return sendError(res, 'Record not found', 'RECORD_NOT_FOUND', 404);
    }

    const access = await checkDocumentAccess(record.documentId, req.user);
    if (access.error) {
      return sendError(res, access.error, access.code, access.status);
    }

    record.status = 'approved';
    record.reviewedAt = new Date();
    record.reviewedBy = req.user.username || req.user.email || req.user._id.toString();
    await record.save();

    return sendSuccess(res, record, 'Record approved successfully');
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/extraction/records/:id/reject
router.post('/records/:id/reject', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return sendError(res, 'Invalid record ID format', 'INVALID_ID', 400);
    }

    const record = await ExtractedRecord.findById(id);
    if (!record) {
      return sendError(res, 'Record not found', 'RECORD_NOT_FOUND', 404);
    }

    const access = await checkDocumentAccess(record.documentId, req.user);
    if (access.error) {
      return sendError(res, access.error, access.code, access.status);
    }

    record.status = 'rejected';
    record.reviewedAt = new Date();
    record.reviewedBy = req.user.username || req.user.email || req.user._id.toString();
    await record.save();

    return sendSuccess(res, record, 'Record rejected successfully');
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/extraction/records/bulk-approve
router.post('/records/bulk-approve', authenticate, async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendError(res, 'Invalid or empty IDs array', 'INVALID_INPUT', 400);
    }

    const validIds = ids.filter(isValidId);
    if (validIds.length === 0) {
      return sendError(res, 'No valid record IDs provided', 'INVALID_INPUT', 400);
    }

    const result = await ExtractedRecord.updateMany(
      { _id: { $in: validIds } },
      {
        $set: {
          status: 'approved',
          reviewedAt: new Date(),
          reviewedBy: req.user.username || req.user.email || req.user._id.toString()
        }
      }
    );

    return sendSuccess(
      res,
      { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount },
      'Records approved successfully'
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;
