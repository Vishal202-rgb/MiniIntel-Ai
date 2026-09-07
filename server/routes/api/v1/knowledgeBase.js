const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const chunkingService = require('../../../services/chunkingService');
const embeddingService = require('../../../services/embeddingService');
const ragService = require('../../../services/ragService');
const DocumentChunk = require('../../../models/DocumentChunk');
const Document = require('../../../models/Document');
const auditService = require('../../../services/auditService');
const { authenticate } = require('../../../middleware/auth');
const { sendSuccess, sendError } = require('../../../utils/apiResponse');
const validate = require('../../../validators/validate');
const {
  validateIndexDocument,
  validateSearchKnowledgeBase
} = require('../../../validators/knowledgeBaseValidator');

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
 * @route   GET /api/v1/knowledge-base
 * @desc    List indexed documents and knowledge base statistics
 * @access  Private
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search, category, classification, page = 1, limit = 50 } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    // Filter documents by ownership if not admin
    const docQuery = {};
    if (req.user.role !== 'admin') {
      docQuery.userId = req.user._id;
    }
    if (search) {
      docQuery.originalName = { $regex: search, $options: 'i' };
    }
    if (category) {
      docQuery.category = category;
    }
    if (classification) {
      docQuery.classification = classification;
    }

    // Find all distinct document IDs that have chunks in the vector collection
    const indexedDocGroup = await DocumentChunk.aggregate([
      {
        $group: {
          _id: '$documentId',
          chunksCount: { $sum: 1 },
          lastIndexedAt: { $max: '$createdAt' }
        }
      }
    ]);

    const indexedMap = new Map();
    indexedDocGroup.forEach((g) => {
      if (g._id) {
        indexedMap.set(g._id.toString(), {
          chunksCount: g.chunksCount,
          lastIndexedAt: g.lastIndexedAt
        });
      }
    });

    const totalVectorChunks = await DocumentChunk.countDocuments();

    // Query documents that match docQuery
    const [matchingDocs, totalDocs] = await Promise.all([
      Document.find(docQuery)
        .select('originalName filename fileType category classification status totalPages uploadedAt')
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Document.countDocuments(docQuery)
    ]);

    const items = matchingDocs.map((doc) => {
      const idxInfo = indexedMap.get(doc._id.toString()) || { chunksCount: 0, lastIndexedAt: null };
      return {
        ...doc,
        isIndexed: idxInfo.chunksCount > 0,
        chunksCount: idxInfo.chunksCount,
        lastIndexedAt: idxInfo.lastIndexedAt
      };
    });

    return sendSuccess(
      res,
      items,
      'Knowledge base documents retrieved successfully',
      200,
      {
        total: totalDocs,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalDocs / limitNum),
        totalIndexedDocuments: indexedDocGroup.length,
        totalVectorChunks
      }
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/knowledge-base/index
 * @desc    Index a document into vector chunks with embeddings
 * @access  Private
 */
router.post('/index', authenticate, validate(validateIndexDocument), async (req, res, next) => {
  try {
    const documentId = req.body?.documentId || req.query?.documentId;

    const access = await checkDocumentAccess(documentId, req.user);
    if (access.error) {
      return sendError(res, access.error, access.code, access.status);
    }

    // Remove any previous vector chunks for clean re-indexing
    await DocumentChunk.deleteMany({ documentId });

    // Reuse existing chunking & embedding pipeline
    const chunks = await chunkingService.chunkDocument(documentId);

    if (!chunks || chunks.length === 0) {
      return sendError(
        res,
        'No text content available to chunk. Document must have extracted text pages before indexing.',
        'NO_TEXT_PAGES',
        400
      );
    }

    const savedChunks = await embeddingService.indexDocument(documentId, chunks);

    // Invalidate RAG in-memory cache so subsequent searches see new vectors immediately
    ragService.invalidateCache();

    await auditService.logFromReq(req, {
      action: 'KNOWLEDGE_BASE_INDEX_DOCUMENT',
      resource: 'DocumentChunk',
      resourceId: documentId,
      details: {
        documentId,
        chunksIndexed: savedChunks.length
      }
    });

    return sendSuccess(
      res,
      {
        documentId,
        documentName: access.document.originalName,
        chunksIndexed: savedChunks.length,
        indexedAt: new Date()
      },
      'Document indexed successfully into Knowledge Base',
      201
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/knowledge-base/:documentId
 * @desc    Remove vector index / chunks of a document from Knowledge Base
 * @access  Private
 */
router.delete('/:documentId', authenticate, async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const access = await checkDocumentAccess(documentId, req.user);
    if (access.error) {
      return sendError(res, access.error, access.code, access.status);
    }

    const deleteResult = await DocumentChunk.deleteMany({ documentId });

    ragService.invalidateCache();

    await auditService.logFromReq(req, {
      action: 'KNOWLEDGE_BASE_DELETE_INDEX',
      resource: 'DocumentChunk',
      resourceId: documentId,
      details: {
        documentId,
        chunksDeleted: deleteResult.deletedCount
      }
    });

    return sendSuccess(
      res,
      {
        documentId,
        chunksDeleted: deleteResult.deletedCount
      },
      'Document vector index deleted successfully'
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/knowledge-base/search
 * @desc    Execute semantic vector search with multi-attribute filtering & provenance
 * @access  Private
 */
router.post('/search', authenticate, validate(validateSearchKnowledgeBase), async (req, res, next) => {
  try {
    const { query, topK = 5, filters = {} } = req.body;

    const limit = Math.max(1, Math.min(50, parseInt(topK) || 5));

    // Reuses existing RAG search logic with filtering & evidence
    const results = await ragService.searchSimilar(query, limit, {
      filters,
      user: req.user
    });

    return sendSuccess(
      res,
      {
        query,
        topK: limit,
        filters,
        totalResults: results.length,
        results
      },
      'Knowledge base search completed successfully'
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/knowledge-base/:documentId
 * @desc    Get indexing details, vector chunks, and metadata for a specific document
 * @access  Private
 */
router.get('/:documentId', authenticate, async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const access = await checkDocumentAccess(documentId, req.user);
    if (access.error) {
      return sendError(res, access.error, access.code, access.status);
    }

    const chunks = await DocumentChunk.find({ documentId })
      .select('-embedding')
      .sort({ chunkIndex: 1 })
      .lean();

    return sendSuccess(
      res,
      {
        document: {
          _id: access.document._id,
          originalName: access.document.originalName,
          filename: access.document.filename,
          fileType: access.document.fileType,
          category: access.document.category,
          classification: access.document.classification,
          status: access.document.status,
          uploadedAt: access.document.uploadedAt
        },
        chunksCount: chunks.length,
        chunks
      },
      'Document knowledge base details retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// Backward-compatible route aliases within v1 namespace
// =========================================================================

// POST /api/v1/knowledge-base/:documentId/index
router.post('/:documentId/index', authenticate, async (req, res, next) => {
  req.body = req.body || {};
  req.body.documentId = req.params.documentId;
  return router.handle(req, res, next);
});

module.exports = router;
