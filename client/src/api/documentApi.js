import apiClient, { uploadFile, downloadFile } from './client.js';

/**
 * Document Ingestion & Storage REST API Module
 * Consumes /api/v1/documents endpoints
 */
export const documentApi = {
  /**
   * Upload a document with multipart/form-data and progress tracking
   * @param {File} file
   * @param {function} [onProgress]
   * @param {object} [extraData]
   */
  uploadDocument: (file, onProgress, extraData = {}) => {
    return uploadFile('/documents/upload', file, {
      fieldName: 'file',
      onProgress,
      extraData,
    });
  },

  /**
   * Get list of documents with filters and pagination
   * @param {object} [params] - { search, type, status, category, classification, page, limit }
   */
  getDocuments: async (params = {}) => {
    const response = await apiClient.get('/documents', { params });
    return response.data;
  },

  /**
   * Get document by ID with parsed pages and chunks
   * @param {string} id
   */
  getDocumentById: async (id) => {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data;
  },

  /**
   * Delete document by ID
   * @param {string} id
   */
  deleteDocument: async (id) => {
    const response = await apiClient.delete(`/documents/${id}`);
    return response.data;
  },

  /**
   * Download original document file
   * @param {string} id
   * @param {string} [filename]
   */
  downloadDocument: (id, filename) => {
    return downloadFile(`/documents/${id}/download`, filename);
  },

  /**
   * Get document metadata
   * @param {string} id
   */
  getDocumentMetadata: async (id) => {
    const response = await apiClient.get(`/documents/${id}/metadata`);
    return response.data;
  },

  /**
   * Update document metadata
   * @param {string} id
   * @param {object} metadata
   */
  updateDocumentMetadata: async (id, metadata) => {
    const response = await apiClient.put(`/documents/${id}/metadata`, metadata);
    return response.data;
  },

  /**
   * Reprocess / re-extract document
   * @param {string} id
   */
  reprocessDocument: async (id) => {
    const response = await apiClient.post(`/documents/${id}/reprocess`);
    return response.data;
  },

  /**
   * Get document processing status
   * @param {string} id
   */
  getDocumentStatus: async (id) => {
    const response = await apiClient.get(`/documents/${id}/status`);
    return response.data;
  },

  /**
   * Retry document (alias to reprocess)
   * @param {string} id
   */
  retryDocument: async (id) => {
    const response = await apiClient.post(`/documents/${id}/reprocess`);
    return response.data;
  },
};

export default documentApi;
