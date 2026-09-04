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

const searchSimilar = async (query, topK = 5, reqContext = null) => {
  const queryEmbedding = await llmService.generateEmbedding(query, { reqContext });
  
  // In-memory cosine similarity fallback - Optimized with Cache & lean()
  if (!cachedChunks || Date.now() - lastCacheTime > CACHE_TTL) {
    cachedChunks = await DocumentChunk.find({ embedding: { $exists: true, $ne: [] } })
      .populate('documentId', 'originalName filename')
      .lean();
    lastCacheTime = Date.now();
  }
  
  const allChunks = cachedChunks;
  
  const chunksWithScores = allChunks
    .filter(chunk => chunk.embedding && chunk.embedding.length === queryEmbedding.length)
    .map(chunk => {
      return {
        chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding)
      };
    });
  
  chunksWithScores.sort((a, b) => b.score - a.score);
  
  return chunksWithScores.slice(0, topK).map(item => ({
    ...(typeof item.chunk.toObject === 'function' ? item.chunk.toObject() : item.chunk),
    similarityScore: item.score
  }));
};

module.exports = {
  searchSimilar
};
