import apiClient from './client';

/**
 * Data Quality & Validation REST API Module
 * Consumes /api/v1/validation endpoints
 */
export const validationApi = {
  /**
   * Trigger validation run for document
   * @param {string|object} documentIdOrPayload
   */
  runValidation: async (documentIdOrPayload) => {
    const payload =
      typeof documentIdOrPayload === 'string'
        ? { documentId: documentIdOrPayload }
        : documentIdOrPayload;
    const response = await apiClient.post('/validation/run', payload);
    return response.data;
  },

  /**
   * Alias to run validation
   * @param {string} documentId
   */
  validateDocument: async (documentId) => {
    const response = await apiClient.post('/validation/run', { documentId });
    return response.data;
  },

  /**
   * Get all validation summaries with filtering and pagination
   * @param {object} [params]
   */
  getValidations: async (params = {}) => {
    const response = await apiClient.get('/validation', { params });
    return response.data;
  },

  /**
   * Get validation summary and issues for a document
   * @param {string} documentId
   */
  getValidationByDocument: async (documentId) => {
    const response = await apiClient.get(`/validation/${documentId}`);
    return response.data;
  },

  /**
   * Alias for legacy getValidationResults
   * @param {string} documentId
   */
  getValidationResults: async (documentId) => {
    const response = await apiClient.get(`/validation/${documentId}`);
    return response.data;
  },

  /**
   * Get validation issues list for document
   * @param {string} documentId
   * @param {object} [params]
   */
  getIssues: async (documentId, params = {}) => {
    const response = await apiClient.get(`/validation/${documentId}/issues`, { params });
    return response.data;
  },

  /**
   * Update or resolve an individual validation issue
   * @param {string} issueId
   * @param {object} data
   */
  updateIssue: async (issueId, data) => {
    const response = await apiClient.put(`/validation/issues/${issueId}`, data);
    return response.data;
  },

  /**
   * Resolve an issue (alias to updateIssue)
   * @param {string} issueId
   * @param {object} [data]
   */
  resolveIssue: async (issueId, data = {}) => {
    const response = await apiClient.put(`/validation/issues/${issueId}`, {
      status: 'resolved',
      ...data,
    });
    return response.data;
  },

  /**
   * Approve all validation issues on a document
   * @param {string} documentId
   * @param {object} [data]
   */
  approveDocument: async (documentId, data = {}) => {
    const response = await apiClient.post(`/validation/${documentId}/approve`, data);
    return response.data;
  },

  /**
   * Submit document validation review
   * @param {string} documentId
   * @param {object} reviewData
   */
  reviewDocument: async (documentId, reviewData) => {
    const response = await apiClient.post(`/validation/${documentId}/review`, reviewData);
    return response.data;
  },

  /**
   * Get validation summary KPIs
   * @param {string} [documentId]
   */
  getValidationSummary: async (documentId) => {
    const url = documentId ? `/validation/summary?documentId=${documentId}` : `/validation/summary`;
    const response = await apiClient.get(url);
    return response.data;
  },
};

export default validationApi;
