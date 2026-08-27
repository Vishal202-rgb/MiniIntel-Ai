const DocumentChunk = require('../models/DocumentChunk');
const llmService = require('./llmService');

const indexDocument = async (documentId, chunks) => {
  const savedChunks = [];
  for (const chunk of chunks) {
    const embedding = await llmService.generateEmbedding(chunk.content);
    
    const docChunk = new DocumentChunk({
      documentId: chunk.documentId,
      pageNumber: chunk.pageNumber,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      metadata: chunk.metadata,
      embedding
    });
    
    const saved = await docChunk.save();
    savedChunks.push(saved);
  }
  return savedChunks;
};

module.exports = {
  indexDocument
};
