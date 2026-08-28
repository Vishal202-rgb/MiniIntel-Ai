const DocumentChunk = require('../models/DocumentChunk');
const llmService = require('./llmService');

const indexDocument = async (documentId, chunks) => {
  const savedChunks = [];
  
  // Gemini allows up to 100 texts per embedding request. We'll batch in groups of 50 to be safe.
  const batchSize = 50;
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const contents = batch.map(c => c.content);
    
    const embeddings = await llmService.generateEmbedding(contents);
    
    for (let j = 0; j < batch.length; j++) {
      const chunk = batch[j];
      const docChunk = new DocumentChunk({
        documentId: chunk.documentId,
        pageNumber: chunk.pageNumber,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        metadata: chunk.metadata,
        embedding: embeddings[j]
      });
      
      const saved = await docChunk.save();
      savedChunks.push(saved);
    }
  }
  
  return savedChunks;
};

module.exports = {
  indexDocument
};
