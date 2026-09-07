import apiClient from './client';

/**
 * Knowledge Base & RAG Semantic Search REST API Module
 * Consumes /api/v1/knowledge-base and /api/v1/rag endpoints
 */
export const knowledgeBaseApi = {
  /**
   * Get all indexed documents in the Knowledge Base
   * @param {object} [params]
   */
  getKnowledgeBase: async (params = {}) => {
    const response = await apiClient.get('/knowledge-base', { params });
    return response.data;
  },

  /**
   * Index a document for vector/semantic retrieval
   * @param {string} documentId
   */
  indexDocument: async (documentId) => {
    const response = await apiClient.post('/knowledge-base/index', { documentId });
    return response.data;
  },

  /**
   * Delete index/embeddings for a document
   * @param {string} documentId
   */
  deleteIndex: async (documentId) => {
    const response = await apiClient.delete(`/knowledge-base/${documentId}`);
    return response.data;
  },

  /**
   * Semantic vector search across indexed documents
   * @param {string|object} queryOrPayload
   * @param {object} [filters]
   */
  search: async (queryOrPayload, filters = {}) => {
    const payload =
      typeof queryOrPayload === 'string'
        ? { query: queryOrPayload, ...filters }
        : queryOrPayload;
    const response = await apiClient.post('/knowledge-base/search', payload);
    return response.data;
  },

  /**
   * Get knowledge base info / chunks for a specific document
   * @param {string} documentId
   */
  getDocumentKnowledge: async (documentId) => {
    const response = await apiClient.get(`/knowledge-base/${documentId}`);
    return response.data;
  },
};

export default knowledgeBaseApi;
