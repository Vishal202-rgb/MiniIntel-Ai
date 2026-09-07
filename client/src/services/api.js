import apiClient from '../api/client.js';
import documentApi from '../api/documentApi.js';
import { normalizeApiResponse, toHybridArray } from '../api/intelligenceNormalizer.js';

/**
 * Enhanced Axios API instance with transparent response normalization.
 * Ensures legacy callers expecting unwrapped arrays or specific fields receive
 * properly typed payloads without breaking new REST v1 envelope consumers.
 */
const api = new Proxy(apiClient, {
  get(target, prop, receiver) {
    if (prop === 'get') {
      return async (url, config) => {
        const response = await target.get(url, config);
        return normalizeApiResponse(url, response, 'get');
      };
    }
    if (prop === 'post') {
      return async (url, data, config) => {
        const response = await target.post(url, data, config);
        return normalizeApiResponse(url, response, 'post');
      };
    }
    const val = Reflect.get(target, prop, receiver);
    if (typeof val === 'function') {
      return val.bind(target);
    }
    return val;
  }
});

export const uploadDocument = (file, onProgress) => {
  return documentApi.uploadDocument(file, onProgress);
};

export const getDocuments = async (params) => {
  const res = await apiClient.get('/documents', { params });
  const rawList = Array.isArray(res.data?.data)
    ? res.data.data
    : (Array.isArray(res.data) ? res.data : []);
  const hybridArray = toHybridArray(rawList, res.data || {});

  return {
    ...res,
    data: hybridArray,
  };
};

export const getDocumentById = (id) => apiClient.get(`/documents/${id}`);
export const getDocumentStatus = (id) => apiClient.get(`/documents/${id}/status`);
export const deleteDocument = (id) => apiClient.delete(`/documents/${id}`);
export const retryDocument = (id) => apiClient.post(`/documents/${id}/reprocess`);

export default api;
