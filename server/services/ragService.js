const DocumentChunk = require('../models/DocumentChunk');
const llmService = require('./llmService');

// Simple cosine similarity calculation
const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

let cachedChunks = null;
let lastCacheTime = 0;
const CACHE_TTL = 30000; // 30 seconds cache for hackathon speed

const invalidateCache = () => {
  cachedChunks = null;
  lastCacheTime = 0;
};

// Helper: Extract concise matching evidence snippet
const extractSnippet = (content, query) => {
  if (!content) return '';
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const lower = content.toLowerCase();

  let firstIndex = -1;
  for (const term of terms) {
    const idx = lower.indexOf(term);
    if (idx !== -1 && (firstIndex === -1 || idx < firstIndex)) {
      firstIndex = idx;
    }
  }

  if (firstIndex === -1) {
    return content.slice(0, 200) + (content.length > 200 ? '...' : '');
  }

  const start = Math.max(0, firstIndex - 60);
  const end = Math.min(content.length, firstIndex + 140);
  return (start > 0 ? '...' : '') + content.slice(start, end).trim() + (end < content.length ? '...' : '');
};

const searchSimilar = async (query, topK = 5, options = null) => {
  const reqContext = options && (options.reqContext || options.isComplex !== undefined)
    ? (options.reqContext || options)
    : options;

  const filters = (options && options.filters) ? options.filters : {};
  const user = options && options.user;

  const queryEmbedding = await llmService.generateEmbedding(query, { reqContext });
  
  // In-memory cosine similarity fallback - Optimized with Cache & lean()
  if (!cachedChunks || Date.now() - lastCacheTime > CACHE_TTL) {
    cachedChunks = await DocumentChunk.find({ embedding: { $exists: true, $ne: [] } })
      .populate('documentId', 'originalName filename fileType category classification userId')
      .lean();
    lastCacheTime = Date.now();
  }
  
  let allChunks = cachedChunks;

  // Apply filters if provided
  if (user && user.role !== 'admin') {
    allChunks = allChunks.filter(c => {
      const doc = c.documentId;
      if (!doc || !doc.userId) return true;
      return doc.userId.toString() === user._id.toString();
    });
  }

  if (filters.document || filters.documentId) {
    const targetDocId = (filters.document || filters.documentId).toString();
    allChunks = allChunks.filter(c => {
      const docId = c.documentId?._id ? c.documentId._id.toString() : (c.documentId ? c.documentId.toString() : '');
      return docId === targetDocId;
    });
  }

  if (filters.classification) {
    const targetClassification = filters.classification.toLowerCase();
    allChunks = allChunks.filter(c => {
      return c.documentId?.classification?.toLowerCase() === targetClassification;
    });
  }

  if (filters.mine) {
    const mineRegex = new RegExp(filters.mine, 'i');
    allChunks = allChunks.filter(c => {
      const inMeta = c.metadata?.mineName && mineRegex.test(c.metadata.mineName);
      const inContent = c.content && mineRegex.test(c.content);
      return inMeta || inContent;
    });
  }

  if (filters.period) {
    const periodRegex = new RegExp(filters.period, 'i');
    allChunks = allChunks.filter(c => {
      const inMeta = c.metadata?.period && periodRegex.test(c.metadata.period);
      const inContent = c.content && periodRegex.test(c.content);
      return inMeta || inContent;
    });
  }

  if (filters.subsidiary) {
    const subRegex = new RegExp(filters.subsidiary, 'i');
    allChunks = allChunks.filter(c => {
      const inMeta = c.metadata?.subsidiary && subRegex.test(c.metadata.subsidiary);
      const inContent = c.content && subRegex.test(c.content);
      return inMeta || inContent;
    });
  }

  if (filters.subject || filters.category) {
    const targetSubject = filters.subject || filters.category;
    const subRegex = new RegExp(targetSubject, 'i');
    allChunks = allChunks.filter(c => {
      const inCategory = c.documentId?.category && subRegex.test(c.documentId.category);
      const inContent = c.content && subRegex.test(c.content);
      return inCategory || inContent;
    });
  }
  
  const chunksWithScores = allChunks
    .filter(chunk => chunk.embedding && chunk.embedding.length === queryEmbedding.length)
    .map(chunk => {
      return {
        chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding)
      };
    });
  
  chunksWithScores.sort((a, b) => b.score - a.score);
  
  return chunksWithScores.slice(0, topK).map(item => {
    const chunkObj = typeof item.chunk.toObject === 'function' ? item.chunk.toObject() : item.chunk;
    const docObj = chunkObj.documentId || {};
    return {
      ...chunkObj,
      chunkId: chunkObj._id,
      documentId: docObj._id || docObj,
      documentName: docObj.originalName || docObj.filename || 'Document',
      classification: docObj.classification || 'internal',
      category: docObj.category || 'Uncategorized',
      snippet: extractSnippet(chunkObj.content, query),
      similarityScore: +item.score.toFixed(4)
    };
  });
};

module.exports = {
  searchSimilar,
  invalidateCache
};
