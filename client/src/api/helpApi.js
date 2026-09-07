import apiClient from './client';

/**
 * Help, Guides & FAQs REST API Module
 * Consumes /api/v1/help endpoints
 */
export const helpApi = {
  /**
   * Get help overview and operational guides
   */
  getHelp: async () => {
    const response = await apiClient.get('/help');
    return response.data;
  },

  /**
   * Get all platform FAQs
   * @param {object} [params]
   */
  getFaqs: async (params = {}) => {
    const response = await apiClient.get('/help/faqs', { params });
    return response.data;
  },

  /**
   * Get specific FAQ by ID
   * @param {string} id
   */
  getFaqById: async (id) => {
    const response = await apiClient.get(`/help/faqs/${id}`);
    return response.data;
  },

  /**
   * Search guides and FAQs
   * @param {string} query
   */
  search: async (query) => {
    const response = await apiClient.get('/help/search', {
      params: { q: query },
    });
    return response.data;
  },
};

export default helpApi;
