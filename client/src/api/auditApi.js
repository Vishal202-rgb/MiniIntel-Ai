import apiClient, { downloadFile } from './client';

/**
 * Compliance & Audit Trail REST API Module
 * Consumes /api/v1/audit endpoints
 */
export const auditApi = {
  /**
   * Get audit log entries with filters and pagination
   * @param {object} [params] - { action, resource, userId, dateFrom, dateTo, page, limit }
   */
  getAuditLogs: async (params = {}) => {
    const response = await apiClient.get('/audit', { params });
    return response.data;
  },

  /**
   * Get audit statistics (total events, successes, failures, active users)
   */
  getAuditStats: async () => {
    const response = await apiClient.get('/audit/stats');
    return response.data;
  },

  /**
   * Get specific audit log entry by ID
   * @param {string} id
   */
  getAuditById: async (id) => {
    const response = await apiClient.get(`/audit/${id}`);
    return response.data;
  },

  /**
   * Get audit logs for a specific user
   * @param {string} userId
   * @param {object} [params]
   */
  getAuditByUser: async (userId, params = {}) => {
    const response = await apiClient.get(`/audit/user/${userId}`, { params });
    return response.data;
  },

  /**
   * Get audit logs for a specific document
   * @param {string} documentId
   * @param {object} [params]
   */
  getAuditByDocument: async (documentId, params = {}) => {
    const response = await apiClient.get(`/audit/document/${documentId}`, { params });
    return response.data;
  },

  /**
   * Get audit logs for a specific report
   * @param {string} reportId
   * @param {object} [params]
   */
  getAuditByReport: async (reportId, params = {}) => {
    const response = await apiClient.get(`/audit/report/${reportId}`, { params });
    return response.data;
  },

  /**
   * Export audit trail as CSV/JSON file
   * @param {object} [params]
   * @param {string} [filename='audit_logs.csv']
   */
  exportAudit: (params = {}, filename = 'audit_logs.csv') => {
    return downloadFile('/audit/export', filename, params);
  },
};

export default auditApi;
