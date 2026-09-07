import apiClient from './client';

/**
 * Topics Discovery & Taxonomy REST API Module
 * Consumes /api/v1/topics endpoints
 */
export const topicsApi = {
  /**
   * Get all extracted topics and taxonomies
   * @param {object} [params]
   */
  getTopics: async (params = {}) => {
    const response = await apiClient.get('/topics', { params });
    // If response contains envelope data, return data or fallback to array
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : (data?.topics || []);
  },

  /**
   * Trigger topic analysis across documents
   * @param {object} [data]
   */
  analyze: async (data = {}) => {
    const response = await apiClient.post('/topics/analyze', data);
    return response.data;
  },

  /**
   * Get topic frequency trends over time
   * @param {object} [params]
   */
  getTrends: async (params = {}) => {
    const response = await apiClient.get('/topics/trends', { params });
    return response.data;
  },

  /**
   * Get topic clustering groupings
   * @param {object} [params]
   */
  getClusters: async (params = {}) => {
    const response = await apiClient.get('/topics/clusters', { params });
    return response.data;
  },

  /**
   * Get named entities mapped to topics
   * @param {object} [params]
   */
  getEntities: async (params = {}) => {
    const response = await apiClient.get('/topics/entities', { params });
    return response.data;
  },

  /**
   * Get emerging or newly trending mining topics
   * @param {object} [params]
   */
  getEmerging: async (params = {}) => {
    const response = await apiClient.get('/topics/emerging', { params });
    return response.data;
  },

  /**
   * Get topic changes and evolution
   * @param {object} [params]
   */
  getChanges: async (params = {}) => {
    const response = await apiClient.get('/topics/changes', { params });
    return response.data;
  },
};

export default topicsApi;
