import apiClient from './client';

/**
 * Cross-Document Intelligence & Entity Linking REST API Module
 * Consumes /api/v1/intelligence endpoints
 */
export const intelligenceApi = {
  /**
   * Get intelligence overview
   * @param {object} [params]
   */
  getIntelligence: async (params = {}) => {
    const response = await apiClient.get('/intelligence', { params });
    return response.data;
  },

  /**
   * Run cross-document intelligence analysis
   * @param {object} [data]
   */
  analyze: async (data = {}) => {
    const response = await apiClient.post('/intelligence/analyze', data);
    return response.data;
  },

  /**
   * Get trends across time and topics
   * @param {object} [params]
   */
  getTrends: async (params = {}) => {
    const response = await apiClient.get('/intelligence/trends', { params });
    return response.data;
  },

  /**
   * Get extracted entities across documents
   * @param {object|string} [paramsOrDocId]
   */
  getEntities: async (paramsOrDocId) => {
    if (typeof paramsOrDocId === 'string') {
      const response = await apiClient.get(`/intelligence/entities/${paramsOrDocId}`);
      return response.data;
    }
    const response = await apiClient.get('/intelligence/entities', { params: paramsOrDocId });
    return response.data;
  },

  /**
   * Get semantic topic clusters
   * @param {object} [params]
   */
  getClusters: async (params = {}) => {
    const response = await apiClient.get('/intelligence/clusters', { params });
    return response.data;
  },

  /**
   * Get document similarity matrix or similar documents for a specific document
   * @param {string|object} [docIdOrParams]
   */
  getSimilarity: async (docIdOrParams) => {
    if (typeof docIdOrParams === 'string') {
      const response = await apiClient.get(`/intelligence/similarity/${docIdOrParams}`);
      return response.data;
    }
    const response = await apiClient.get('/intelligence/similarity', { params: docIdOrParams });
    return response.data;
  },

  /**
   * Detect changes, revisions, and variances between document versions
   * @param {object} [params]
   */
  getChanges: async (params = {}) => {
    const response = await apiClient.get('/intelligence/changes', { params });
    return response.data;
  },

  /**
   * Link evidence across documents
   * @param {string} documentId
   * @param {object} data
   */
  linkEvidence: async (documentId, data = {}) => {
    const response = await apiClient.post(`/intelligence/link-evidence/${documentId}`, data);
    return response.data;
  },
};

export default intelligenceApi;
