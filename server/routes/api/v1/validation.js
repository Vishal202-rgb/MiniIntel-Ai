const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const validationService = require('../../../services/validationService');
const validationController = require('../../../controllers/validationController');
const ValidationResult = require('../../../models/ValidationResult');
const ExtractedRecord = require('../../../models/ExtractedRecord');
const Document = require('../../../models/Document');
const auditService = require('../../../services/auditService');
const { authenticate } = require('../../../middleware/auth');
const { sendSuccess, sendError } = require('../../../utils/apiResponse');
const validate = require('../../../validators/validate');
const {
  validateRunValidation,
  validateIssueUpdate,
  validateDocumentReview
} = require('../../../validators/validationValidator');

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

// Helper: Calculate quality score and severity breakdown
const computeQualityMetrics = (issues) => {
  const bySeverity = { info: 0, warning: 0, error: 0, critical: 0 };
  const byType = {};
  let openCount = 0;
  let resolvedCount = 0;

  issues.forEach((r) => {
    if (r.status === 'open') {
      openCount++;
      if (bySeverity[r.severity] !== undefined) {
        bySeverity[r.severity]++;
      }
    } else if (r.status === 'resolved') {
      resolvedCount++;
    }

    if (r.type) {
      byType[r.type] = (byType[r.type] || 0) + 1;
    }
  });

  const penalty =
    bySeverity.critical * 5 +
    bySeverity.error * 3 +
    bySeverity.warning * 1;

  const qualityScore = Math.max(0, 100 - penalty);

  return {
    qualityScore,
    totalIssues: issues.length,
    openIssues: openCount,
    resolvedIssues: resolvedCount,
    bySeverity,
    byType
  };
};

/**
 * @route   POST /api/v1/validation/run
 * @desc    Execute validation rules on a document and calculate quality metrics
 * @access  Private
 */
router.post('/run', authenticate, validate(validateRunValidation), async (req, res, next) => {
  try {
    const documentId = req.body?.documentId || req.query?.documentId;

    const access = await checkDocumentAccess(documentId, req.user);
    if (access.error) {
      return sendError(res, access.error, access.code, access.status);
    }

    // Run existing business rules from validationService
    await validationService.validateDocument(documentId);

    // Retrieve all issues for this document
    const issues = await ValidationResult.find({ documentId })
      .populate('recordId')
      .sort({ createdAt: -1 });

    const metrics = computeQualityMetrics(issues);

    // Fetch average confidence of extracted records for mobile/web dashboard
    const records = await ExtractedRecord.find({ documentId }).select('confidenceScore');
    const avgConfidence = records.length > 0
      ? +(records.reduce((sum, r) => sum + (r.confidenceScore || 0), 0) / records.length).toFixed(2)
      : 0;

    return sendSuccess(
      res,
      {
        documentId,
        documentName: access.document.originalName,
        qualityScore: metrics.qualityScore,
        avgConfidence,
        totalIssues: metrics.totalIssues,
        openIssues: metrics.openIssues,
        resolvedIssues: metrics.resolvedIssues,
        bySeverity: metrics.bySeverity,
        byType: metrics.byType,
        issues
      },
      'Document validation completed successfully',
      200
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/validation
 * @desc    Get validation summaries and issues across accessible documents
 * @access  Private
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { documentId, status, severity, type, page = 1, limit = 50 } = req.query;
    const query = {};

    if (documentId) {
      const access = await checkDocumentAccess(documentId, req.user);
      if (access.error) {
        return sendError(res, access.error, access.code, access.status);
      }
      query.documentId = documentId;
    } else if (req.user.role !== 'admin') {
      // Scoped to user's documents
      const userDocs = await Document.find({ userId: req.user._id }).select('_id');
      const docIds = userDocs.map((d) => d._id);
      query.documentId = { $in: docIds };
    }

    if (status && status !== 'all') {
      query.status = status;
    }
    if (severity) {
      query.severity = severity;
    }
    if (type) {
      query.type = type;
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [issues, total, allMatching] = await Promise.all([
      ValidationResult.find(query)
        .populate('documentId', 'originalName filename status category')
        .populate('recordId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ValidationResult.countDocuments(query),
      ValidationResult.find(query).select('severity status type')
    ]);

    const metrics = computeQualityMetrics(allMatching);

    return sendSuccess(res, issues, 'Validation results retrieved successfully', 200, {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
      qualityScore: metrics.qualityScore,
      bySeverity: metrics.bySeverity,
      byType: metrics.byType
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/validation/summary
 * @desc    Get validation summary KPIs and issues list (legacy/dashboard support)
 * @access  Private
 */
router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const { documentId } = req.query;
    const filter = documentId ? { documentId } : {};

    const results = await ValidationResult.find(filter)
      .populate('documentId', 'filename title originalName')
      .sort({ createdAt: -1 });

    const summary = {
      totalIssues: results.length,
      bySeverity: {
        info: 0,
        warning: 0,
        error: 0,
        critical: 0
      },
      qualityScore: 100,
      issues: results
    };
    return sendSuccess(res, summary, 'Validation summary retrieved');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/validation/:documentId
 * @desc    Get complete validation summary and metrics for a specific document
 * @access  Private
 */
router.get('/:documentId', authenticate, async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const access = await checkDocumentAccess(documentId, req.user);
    if (access.error) {
      return sendError(res, access.error, access.code, access.status);
    }

    const [issues, records] = await Promise.all([
      ValidationResult.find({ documentId })
        .populate('recordId')
        .sort({ createdAt: -1 }),
      ExtractedRecord.find({ documentId })
        .select('parameter value unit confidenceScore status')
    ]);

    const metrics = computeQualityMetrics(issues);

    let confidenceSum = 0;
    records.forEach((r) => {
      if (typeof r.confidenceScore === 'number') {
        confidenceSum += r.confidenceScore;
      }
    });
    const avgConfidence = records.length > 0 ? +(confidenceSum / records.length).toFixed(2) : 0;

    return sendSuccess(
      res,
      {
        documentId: access.document._id,
        documentName: access.document.originalName,
        documentStatus: access.document.status,
        qualityScore: metrics.qualityScore,
        avgConfidence,
        totalIssues: metrics.totalIssues,
        openIssues: metrics.openIssues,
        resolvedIssues: metrics.resolvedIssues,
        recordsCount: records.length,
        bySeverity: metrics.bySeverity,
        byType: metrics.byType,
        issues
      },
      'Document validation summary retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/validation/:documentId/issues
 * @desc    Get filtered and paginated issues for a specific document
 * @access  Private
 */
router.get('/:documentId/issues', authenticate, async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { status, severity, type, page = 1, limit = 50 } = req.query;

    const access = await checkDocumentAccess(documentId, req.user);
    if (access.error) {
      return sendError(res, access.error, access.code, access.status);
    }

    const query = { documentId };

    if (status && status !== 'all') {
      query.status = status;
    }
    if (severity) {
      query.severity = severity;
    }
    if (type) {
      query.type = type;
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [issues, total] = await Promise.all([
      ValidationResult.find(query)
        .populate('recordId')
        .populate('documentId', 'originalName filename status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ValidationResult.countDocuments(query)
    ]);

    return sendSuccess(res, issues, 'Validation issues retrieved successfully', 200, {
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
 * @route   PUT /api/v1/validation/issues/:issueId
 * @desc    Resolve or update a validation issue and sync corrections with extracted record
 * @access  Private
 */
router.put('/issues/:issueId', authenticate, validate(validateIssueUpdate), async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const { resolution, correctedValue, notes, status = 'resolved' } = req.body;

    if (!isValidId(issueId)) {
      return sendError(res, 'Invalid issue ID format', 'INVALID_ID', 400);
    }

    const issue = await ValidationResult.findById(issueId);
    if (!issue) {
      return sendError(res, 'Validation issue not found', 'ISSUE_NOT_FOUND', 404);
    }

    const access = await checkDocumentAccess(issue.documentId, req.user);
    if (access.error) {
      return sendError(res, access.error, access.code, access.status);
    }

    let updatedRecord = null;

    // If a correctedValue is provided and issue points to a record, apply correction
    if (correctedValue !== undefined && issue.recordId) {
      const record = await ExtractedRecord.findById(issue.recordId);
      if (record) {
        if (!record.originalValue && record.value !== undefined) {
          record.originalValue = record.value;
        }

        record.editHistory.push({
          field: issue.field || 'value',
          oldValue: record.value,
          newValue: correctedValue,
          editedAt: new Date()
        });

        record.value = correctedValue;
        record.reviewedAt = new Date();
        record.reviewedBy = req.user.username || req.user.email || req.user._id.toString();
        await record.save();
        updatedRecord = record;
      }
    }

    issue.status = status;
    issue.resolvedAt = new Date();
    if (resolution !== undefined) issue.resolution = resolution;
    if (correctedValue !== undefined) issue.correctedValue = correctedValue;
    if (notes !== undefined) issue.notes = notes;

    if (!issue.resolution && (correctedValue || notes)) {
      issue.resolution = `Corrected to: ${correctedValue || 'N/A'}. Notes: ${notes || 'None'}`;
    }

    await issue.save();

    await auditService.logFromReq(req, {
      action: 'RESOLVE_VALIDATION_ISSUE',
      resource: 'ValidationResult',
      resourceId: issue._id,
      details: {
        issueId,
        status: issue.status,
        resolution: issue.resolution,
        correctedValue: issue.correctedValue
      }
    });

    return sendSuccess(
      res,
      {
        issue,
        record: updatedRecord
      },
      'Validation issue updated successfully'
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/validation/:documentId/approve
 * @desc    Approve document validation and finalize extracted records
 * @access  Private (Owner, Reviewer, or Admin)
 */
router.post('/:documentId/approve', authenticate, async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const access = await checkDocumentAccess(documentId, req.user);
    if (access.error) {
      return sendError(res, access.error, access.code, access.status);
    }

    const document = access.document;
    document.status = 'completed';
    await document.save();

    const reviewerName = req.user.username || req.user.email || req.user._id.toString();

    // Finalize all pending extracted records
    const recordUpdate = await ExtractedRecord.updateMany(
      { documentId: document._id, status: 'pending' },
      {
        $set: {
          status: 'approved',
          reviewedAt: new Date(),
          reviewedBy: reviewerName
        }
      }
    );

    // Auto-resolve any non-critical open issues
    await ValidationResult.updateMany(
      { documentId: document._id, status: 'open', severity: { $in: ['info', 'warning'] } },
      {
        $set: {
          status: 'resolved',
          resolution: `Approved by ${reviewerName}`,
          resolvedAt: new Date()
        }
      }
    );

    await auditService.logFromReq(req, {
      action: 'APPROVE_DOCUMENT_VALIDATION',
      resource: 'Document',
      resourceId: document._id,
      details: {
        documentId: document._id,
        recordsApproved: recordUpdate.modifiedCount,
        approvedBy: reviewerName
      }
    });

    return sendSuccess(
      res,
      {
        documentId: document._id,
        documentName: document.originalName,
        status: 'approved',
        approvedBy: reviewerName,
        approvedAt: new Date(),
        recordsApproved: recordUpdate.modifiedCount
      },
      'Document validation approved successfully'
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/validation/:documentId/review
 * @desc    Submit human review feedback/decision for a document and batch-resolve issues
 * @access  Private
 */
router.post('/:documentId/review', authenticate, validate(validateDocumentReview), async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { decision = 'approved', comments = '', issueResolutions = [] } = req.body;

    const access = await checkDocumentAccess(documentId, req.user);
    if (access.error) {
      return sendError(res, access.error, access.code, access.status);
    }

    const document = access.document;
    const reviewerName = req.user.username || req.user.email || req.user._id.toString();
    let resolvedCount = 0;

    // Process batch issue resolutions if provided (ideal for mobile / tablet review workflows)
    if (Array.isArray(issueResolutions) && issueResolutions.length > 0) {
      for (const item of issueResolutions) {
        if (!item.issueId || !isValidId(item.issueId)) continue;

        const issue = await ValidationResult.findOne({ _id: item.issueId, documentId: document._id });
        if (!issue) continue;

        if (item.correctedValue !== undefined && issue.recordId) {
          const record = await ExtractedRecord.findById(issue.recordId);
          if (record) {
            record.editHistory.push({
              field: issue.field || 'value',
              oldValue: record.value,
              newValue: item.correctedValue,
              editedAt: new Date()
            });
            record.value = item.correctedValue;
            record.reviewedAt = new Date();
            record.reviewedBy = reviewerName;
            await record.save();
          }
        }

        issue.status = item.status || 'resolved';
        issue.resolution = item.resolution || `Reviewed by ${reviewerName}`;
        issue.notes = item.notes || comments;
        issue.resolvedAt = new Date();
        await issue.save();
        resolvedCount++;
      }
    }

    // Apply document status transition based on review decision
    if (decision === 'approved') {
      document.status = 'completed';
      await ExtractedRecord.updateMany(
        { documentId: document._id, status: 'pending' },
        {
          $set: {
            status: 'approved',
            reviewedAt: new Date(),
            reviewedBy: reviewerName
          }
        }
      );
    } else if (decision === 'rejected') {
      document.status = 'failed';
      await ExtractedRecord.updateMany(
        { documentId: document._id, status: 'pending' },
        {
          $set: {
            status: 'rejected',
            reviewedAt: new Date(),
            reviewedBy: reviewerName
          }
        }
      );
    }

    await document.save();

    await auditService.logFromReq(req, {
      action: 'REVIEW_DOCUMENT_VALIDATION',
      resource: 'Document',
      resourceId: document._id,
      details: {
        documentId: document._id,
        decision,
        comments,
        resolvedCount,
        reviewedBy: reviewerName
      }
    });

    return sendSuccess(
      res,
      {
        documentId: document._id,
        documentName: document.originalName,
        decision,
        comments,
        reviewedBy: reviewerName,
        reviewedAt: new Date(),
        resolvedIssuesCount: resolvedCount
      },
      `Document review completed with decision: ${decision}`
    );
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// Backward-compatible route aliases within v1 namespace
// =========================================================================

// POST /api/v1/validation/:documentId/validate
router.post('/:documentId/validate', authenticate, async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const access = await checkDocumentAccess(documentId, req.user);
    if (access.error) {
      return sendError(res, access.error, access.code, access.status);
    }
    const results = await validationService.validateDocument(documentId);
    return sendSuccess(res, { count: results.length, results }, 'Validation completed');
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/validation/summary
router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const { documentId } = req.query;
    const filter = documentId ? { documentId } : {};
    const results = await ValidationResult.find(filter)
      .populate('documentId', 'originalName filename title')
      .sort({ createdAt: -1 });

    const metrics = computeQualityMetrics(results);

    return sendSuccess(
      res,
      {
        totalIssues: metrics.totalIssues,
        bySeverity: metrics.bySeverity,
        qualityScore: metrics.qualityScore,
        issues: results
      },
      'Validation summary retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/validation/:id/resolve
router.put('/:id/resolve', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return sendError(res, 'Invalid ID format', 'INVALID_ID', 400);
    }
    const issue = await ValidationResult.findById(id);
    if (!issue) {
      return sendError(res, 'Validation result not found', 'NOT_FOUND', 404);
    }
    issue.status = 'resolved';
    issue.resolvedAt = new Date();
    if (req.body.resolution) issue.resolution = req.body.resolution;
    if (req.body.correctedValue) issue.correctedValue = req.body.correctedValue;
    if (req.body.notes) issue.notes = req.body.notes;
    await issue.save();
    return sendSuccess(res, issue, 'Issue resolved successfully');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
