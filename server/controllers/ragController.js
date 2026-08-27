const chunkingService = require('../services/chunkingService');
const embeddingService = require('../services/embeddingService');
const ragService = require('../services/ragService');

const indexDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const chunks = await chunkingService.chunkDocument(documentId);
    const savedChunks = await embeddingService.indexDocument(documentId, chunks);
    
    res.status(200).json({ 
      message: 'Document indexed successfully', 
      chunksIndexed: savedChunks.length 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error indexing document', error: error.message });
  }
};

const search = async (req, res) => {
  try {
    const { query, topK } = req.body;
    
    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }
    
    const results = await ragService.searchSimilar(query, topK || 5);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: 'Error searching documents', error: error.message });
  }
};

module.exports = {
  indexDocument,
  search
};
