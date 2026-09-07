import apiClient, { downloadFile } from './client';

/**
 * Report Generation, Export & Lifecycle REST API Module
 * Consumes /api/v1/reports endpoints
 */
export const reportsApi = {
  /**
   * Generate a new AI report with evidence backing
   * @param {object} data - { title, type, sourceDocId, instructions, ... }
   */
  generateReport: async (data) => {
    const response = await apiClient.post('/reports/generate', data);
    return response.data;
  },

  /**
   * Get list of reports with filters and pagination
   * @param {object} [params] - { status, type, page, limit }
   */
  getReports: async (params = {}) => {
    const response = await apiClient.get('/reports', { params });
    return response.data;
  },

  /**
   * Get single report by ID
   * @param {string} id
   */
  getReportById: async (id) => {
    const response = await apiClient.get(`/reports/${id}`);
    return response.data;
  },

  /**
   * Update report details or content
   * @param {string} id
   * @param {object} data
   */
  updateReport: async (id, data) => {
    const response = await apiClient.put(`/reports/${id}`, data);
    return response.data;
  },

  /**
   * Delete report by ID
   * @param {string} id
   */
  deleteReport: async (id) => {
    const response = await apiClient.delete(`/reports/${id}`);
    return response.data;
  },

  /**
   * Submit report for admin review
   * @param {string} id
   */
  submitReview: async (id) => {
    const response = await apiClient.post(`/reports/${id}/submit-review`);
    return response.data;
  },

  /**
   * Approve report (Admin only)
   * @param {string} id
   */
  approveReport: async (id) => {
    const response = await apiClient.post(`/reports/${id}/approve`);
    return response.data;
  },

  /**
   * Reject report with comments (Admin/Reviewer)
   * @param {string} id
   * @param {string|object} commentsOrData
   */
  rejectReport: async (id, commentsOrData) => {
    const payload =
      typeof commentsOrData === 'string'
        ? { comments: commentsOrData }
        : commentsOrData;
    const response = await apiClient.post(`/reports/${id}/reject`, payload);
    return response.data;
  },

  /**
   * Get report evidence citations and sources
   * @param {string} id
   */
  getEvidence: async (id) => {
    const response = await apiClient.get(`/reports/${id}/evidence`);
    return response.data;
  },

  /**
   * Get report version history
   * @param {string} id
   */
  getVersionHistory: async (id) => {
    const response = await apiClient.get(`/reports/${id}/version-history`);
    return response.data;
  },

  /**
   * Compare changes between report versions
   * @param {string} id
   * @param {object} [params]
   */
  getChanges: async (id, params = {}) => {
    const response = await apiClient.get(`/reports/${id}/changes`, { params });
    return response.data;
  },

  /**
   * Export report as PDF
   * @param {string} id
   * @param {string} [filename]
   */
  exportPdf: (id, filename = 'report.pdf') => {
    return downloadFile(`/reports/${id}/export/pdf`, filename);
  },

  /**
   * Export report as DOCX
   * @param {string} id
   * @param {string} [filename]
   */
  exportDocx: (id, filename = 'report.docx') => {
    return downloadFile(`/reports/${id}/export/docx`, filename);
  },

  /**
   * Export report as CSV
   * @param {string} id
   * @param {string} [filename]
   */
  exportCsv: (id, filename = 'report.csv') => {
    return downloadFile(`/reports/${id}/export/csv`, filename);
  },

  /**
   * Export report as JSON
   * @param {string} id
   * @param {string} [filename]
   */
  exportJson: (id, filename = 'report.json') => {
    return downloadFile(`/reports/${id}/export/json`, filename);
  },

  /**
   * Generic export helper by format
   * @param {string} id
   * @param {'pdf'|'docx'|'csv'|'json'} format
   * @param {string} [filename]
   */
  exportReport: (id, format = 'pdf', filename) => {
    const defaultName = filename || `report_${id}.${format}`;
    return downloadFile(`/reports/${id}/export/${format}`, defaultName);
  },
};

export default reportsApi;
