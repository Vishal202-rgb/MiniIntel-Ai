import apiClient from './client.js';
import {
  normalizeOverviewResponse,
  normalizeAnalyzeResponse,
  normalizeTrendsResponse,
  normalizeEntitiesResponse,
  normalizeClustersResponse,
  normalizeSimilarityResponse,
  normalizeChangesResponse,
} from './intelligenceNormalizer.js';

/**
 * Cross-Document Intelligence & Entity Linking REST API Module
 * Consumes /api/v1/intelligence endpoints with full type-safe response normalization.
 */
export const intelligenceApi = {
  /**
   * Get intelligence overview
   * @param {object} [params]
   */
  getIntelligence: async (params = {}) => {
    const response = await apiClient.get('/intelligence', { params });
    const normalized = normalizeOverviewResponse(response);
    return normalized.data;
  },

  /**
   * Run cross-document intelligence analysis
   * @param {object} [data]
   */
  analyze: async (data = {}) => {
    const response = await apiClient.post('/intelligence/analyze', data);
    const normalized = normalizeAnalyzeResponse(response);
    return normalized.data;
  },

  /**
   * Get trends across time and topics
   * @param {object} [params]
   */
  getTrends: async (params = {}) => {
    const response = await apiClient.get('/intelligence/trends', { params });
    const normalized = normalizeTrendsResponse(response);
    return normalized.data;
  },

  /**
   * Get extracted entities across documents or for a single document
   * @param {object|string} [paramsOrDocId]
   */
  getEntities: async (paramsOrDocId) => {
    if (typeof paramsOrDocId === 'string') {
      const response = await apiClient.get(`/intelligence/entities/${paramsOrDocId}`);
      const normalized = normalizeEntitiesResponse(response, true);
      return normalized.data;
    }
    const response = await apiClient.get('/intelligence/entities', { params: paramsOrDocId });
    const normalized = normalizeEntitiesResponse(response, false);
    return normalized.data;
  },

  /**
   * Get semantic topic clusters
   * @param {object} [params]
   */
  getClusters: async (params = {}) => {
    const response = await apiClient.get('/intelligence/clusters', { params });
    const normalized = normalizeClustersResponse(response);
    return normalized.data;
  },

  /**
   * Get document similarity matrix or similar documents for a specific document
   * @param {string|object} [docIdOrParams]
   */
  getSimilarity: async (docIdOrParams) => {
    if (typeof docIdOrParams === 'string') {
      const response = await apiClient.get(`/intelligence/similarity/${docIdOrParams}`);
      const normalized = normalizeSimilarityResponse(response, true);
      return normalized.data;
    }
    const response = await apiClient.get('/intelligence/similarity', { params: docIdOrParams });
    const normalized = normalizeSimilarityResponse(response, false);
    return normalized.data;
  },

  /**
   * Detect changes, revisions, and variances between document versions
   * @param {object} [params]
   */
  getChanges: async (params = {}) => {
    const response = await apiClient.get('/intelligence/changes', { params });
    const normalized = normalizeChangesResponse(response);
    return normalized.data;
  },

  /**
   * Link evidence across documents
   * @param {string} documentId
   * @param {object} data
   */
  linkEvidence: async (documentId, data = {}) => {
    const response = await apiClient.post(`/intelligence/link-evidence/${documentId}`, data);
    const inner = response.data?.data || response.data || {};
    const linked = Array.isArray(inner.linked) ? inner.linked : (Array.isArray(inner) ? inner : []);
    return {
      documentId: inner.documentId || documentId,
      linked,
      success: response.data?.success ?? true,
      data: { documentId: inner.documentId || documentId, linked },
    };
  },
};

export default intelligenceApi;
