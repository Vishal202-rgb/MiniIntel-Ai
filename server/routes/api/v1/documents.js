const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const mongoose = require('mongoose');

const upload = require('../../../middleware/upload');
const { authenticate } = require('../../../middleware/auth');
const Document = require('../../../models/Document');
const DocumentPage = require('../../../models/DocumentPage');
const DocumentChunk = require('../../../models/DocumentChunk');
const ProcessingJob = require('../../../models/ProcessingJob');
const ExtractedRecord = require('../../../models/ExtractedRecord');
const { processDocument } = require('../../../services/processingService');
const validationController = require('../../../controllers/validationController');
const { sendSuccess, sendError } = require('../../../utils/apiResponse');
const validate = require('../../../validators/validate');
const { validateDocumentMetadataUpdate } = require('../../../validators/documentValidator');

// Helper: Calculate SHA-256 hash for deduplication
const getFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
};

// Helper: Determine fileType from mimetype
const getFileType = (mimetype) => {
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype.includes('wordprocessingml.document')) return 'docx';
  if (mimetype.includes('spreadsheetml.sheet') || mimetype === 'application/vnd.ms-excel') return 'xlsx';
  if (mimetype.includes('presentationml.presentation') || mimetype === 'application/vnd.ms-powerpoint') return 'pptx';
  if (mimetype === 'text/csv') return 'csv';
  if (mimetype.startsWith('image/')) return 'image';
  return 'pdf';
};

// Helper: Validate ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * @route   POST /api/v1/documents/upload
 * @desc    Upload a single document (multipart/form-data) with deduplication & queued processing
 * @access  Private
 */
router.post('/upload', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded. Please provide a document file in the "file" form field.', 'NO_FILE_UPLOADED', 400);
    }

    const fileHash = await getFileHash(req.file.path);
    const existingDoc = await Document.findOne({ hash: fileHash });

    if (existingDoc) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return sendError(res, 'Duplicate document detected (checksum matched an existing document).', 'DUPLICATE_DOCUMENT', 409);
    }

    const fileType = getFileType(req.file.mimetype);

    const document = new Document({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      fileType: fileType,
      hash: fileHash,
      userId: req.user._id
    });

    await document.save();

    const job = new ProcessingJob({
      documentId: document._id,
      status: 'queued'
    });
    await job.save();

    // Fire and forget background ingestion pipeline
    processDocument(document._id);

    return sendSuccess(res, document, 'Document uploaded successfully and queued for processing', 201);
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

/**
 * @route   GET /api/v1/documents
 * @desc    List all accessible documents with filters and pagination
 * @access  Private
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search, type, status, category, classification, dateFrom, dateTo, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.originalName = { $regex: search, $options: 'i' };
    }
    if (type) {
      query.fileType = type;
    }
    if (status) {
      query.status = status;
    }
    if (category) {
      query.category = category;
    }
    if (classification) {
      query.classification = classification;
    }
    if (dateFrom || dateTo) {
      query.uploadedAt = {};
      if (dateFrom) query.uploadedAt.$gte = new Date(dateFrom);
      if (dateTo) query.uploadedAt.$lte = new Date(dateTo);
    }

    // Role-based access: normal users only see their own documents
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [documents, total] = await Promise.all([
      Document.find(query).sort({ uploadedAt: -1 }).skip(skip).limit(limitNum),
      Document.countDocuments(query)
    ]);

    return sendSuccess(res, documents, 'Documents retrieved successfully', 200, {
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
 * @route   GET /api/v1/documents/:id
 * @desc    Get document details and extracted pages
 * @access  Private (Owner or Admin)
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 'Invalid document ID format', 'INVALID_ID', 400);
    }

    const document = await Document.findById(req.params.id);
    if (!document) {
      return sendError(res, 'Document not found', 'DOCUMENT_NOT_FOUND', 404);
    }

    if (req.user.role !== 'admin' && document.userId?.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied: not authorized to view this document', 'FORBIDDEN', 403);
    }

    const pages = await DocumentPage.find({ documentId: document._id }).sort({ pageNumber: 1 });

    return sendSuccess(res, { document, pages }, 'Document retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/documents/:id
 * @desc    Delete document, pages, chunks, and physical file
 * @access  Private (Owner or Admin)
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 'Invalid document ID format', 'INVALID_ID', 400);
    }

    const document = await Document.findById(req.params.id);
    if (!document) {
      return sendError(res, 'Document not found', 'DOCUMENT_NOT_FOUND', 404);
    }

    if (req.user.role !== 'admin' && document.userId?.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied: not authorized to delete this document', 'FORBIDDEN', 403);
    }

    await Promise.all([
      Document.findByIdAndDelete(req.params.id),
      DocumentPage.deleteMany({ documentId: req.params.id }),
      DocumentChunk.deleteMany({ documentId: req.params.id }),
      ProcessingJob.deleteMany({ documentId: req.params.id }),
      ExtractedRecord.deleteMany({ documentId: req.params.id })
    ]);

    const baseDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '../../..');
    const filePath = path.join(baseDir, 'uploads', document.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return sendSuccess(res, { deletedId: req.params.id }, 'Document deleted successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/documents/:id/download
 * @desc    Download the original document file
 * @access  Private (Owner or Admin)
 */
router.get('/:id/download', authenticate, async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 'Invalid document ID format', 'INVALID_ID', 400);
    }

    const document = await Document.findById(req.params.id);
    if (!document) {
      return sendError(res, 'Document not found', 'DOCUMENT_NOT_FOUND', 404);
    }

    if (req.user.role !== 'admin' && document.userId?.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied: not authorized to download this document', 'FORBIDDEN', 403);
    }

    const baseDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '../../..');
    const filePath = path.join(baseDir, 'uploads', document.filename);

    if (!fs.existsSync(filePath)) {
      return sendError(res, 'Document file not found on storage disk', 'FILE_NOT_FOUND', 404);
    }

    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.originalName)}"`);
    return res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/documents/:id/metadata
 * @desc    Get document technical and intelligence metadata
 * @access  Private (Owner or Admin)
 */
router.get('/:id/metadata', authenticate, async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 'Invalid document ID format', 'INVALID_ID', 400);
    }

    const document = await Document.findById(req.params.id);
    if (!document) {
      return sendError(res, 'Document not found', 'DOCUMENT_NOT_FOUND', 404);
    }

    if (req.user.role !== 'admin' && document.userId?.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied: not authorized to view document metadata', 'FORBIDDEN', 403);
    }

    const metadata = {
      _id: document._id,
      originalName: document.originalName,
      filename: document.filename,
      mimeType: document.mimeType,
      fileType: document.fileType,
      fileSize: document.fileSize,
      hash: document.hash,
      status: document.status,
      category: document.category,
      classification: document.classification,
      totalPages: document.totalPages,
      entities: document.entities || [],
      topicIds: document.topicIds || [],
      similarDocuments: document.similarDocuments || [],
      gisMetadata: document.gisMetadata || {},
      retentionDate: document.retentionDate || null,
      uploadedAt: document.uploadedAt,
      processedAt: document.processedAt || null
    };

    return sendSuccess(res, metadata, 'Document metadata retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/documents/:id/metadata
 * @desc    Update editable document metadata (category, classification, gisMetadata, retentionDate)
 * @access  Private (Owner or Admin)
 */
router.put('/:id/metadata', authenticate, validate(validateDocumentMetadataUpdate), async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 'Invalid document ID format', 'INVALID_ID', 400);
    }

    const document = await Document.findById(req.params.id);
    if (!document) {
      return sendError(res, 'Document not found', 'DOCUMENT_NOT_FOUND', 404);
    }

    if (req.user.role !== 'admin' && document.userId?.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied: not authorized to modify document metadata', 'FORBIDDEN', 403);
    }

    const { category, classification, gisMetadata, retentionDate } = req.body;

    if (category !== undefined) document.category = category.trim();
    if (classification !== undefined) document.classification = classification;
    if (gisMetadata !== undefined) {
      document.gisMetadata = {
        ...document.gisMetadata,
        ...gisMetadata
      };
    }
    if (retentionDate !== undefined) {
      document.retentionDate = retentionDate ? new Date(retentionDate) : null;
    }

    await document.save();

    return sendSuccess(res, document, 'Document metadata updated successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/documents/:id/reprocess
 * @desc    Trigger document re-ingestion and OCR/text parsing
 * @access  Private (Owner or Admin)
 */
router.post('/:id/reprocess', authenticate, async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 'Invalid document ID format', 'INVALID_ID', 400);
    }

    const document = await Document.findById(req.params.id);
    if (!document) {
      return sendError(res, 'Document not found', 'DOCUMENT_NOT_FOUND', 404);
    }

    if (req.user.role !== 'admin' && document.userId?.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied: not authorized to reprocess this document', 'FORBIDDEN', 403);
    }

    document.status = 'pending';
    document.error = '';
    await document.save();

    await ProcessingJob.deleteMany({ documentId: document._id });

    const job = new ProcessingJob({
      documentId: document._id,
      status: 'queued'
    });
    await job.save();

    // Trigger async processing pipeline
    processDocument(document._id);

    return sendSuccess(res, document, 'Document queued for reprocessing');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/documents/:id/status
 * @desc    Get document ingestion job status
 * @access  Private
 */
router.get('/:id/status', authenticate, async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return sendError(res, 'Invalid document ID format', 'INVALID_ID', 400);
    }

    const job = await ProcessingJob.findOne({ documentId: req.params.id });
    if (!job) {
      return sendError(res, 'Processing job not found', 'JOB_NOT_FOUND', 404);
    }

    return sendSuccess(res, job, 'Processing job status retrieved');
  } catch (error) {
    next(error);
  }
});

// Backward-compatible alias for legacy retry endpoint
router.post('/:id/retry', authenticate, async (req, res, next) => {
  return res.redirect(307, `/api/v1/documents/${req.params.id}/reprocess`);
});

// Route alias for validation results
router.get('/:id/validation', authenticate, validationController.getResults);

module.exports = router;
