import apiClient from '../api/client';
import documentApi from '../api/documentApi';

const api = apiClient;

export const uploadDocument = (file, onProgress) => {
  return documentApi.uploadDocument(file, onProgress);
};

export const getDocuments = async (params) => {
  const res = await apiClient.get('/documents', { params });
  const rawList = Array.isArray(res.data?.data)
    ? res.data.data
    : (Array.isArray(res.data) ? res.data : []);
  const hybridArray = [...rawList];
  hybridArray.data = rawList;
  hybridArray.success = res.data?.success ?? true;
  hybridArray.message = res.data?.message;
  hybridArray.pagination = res.data?.pagination;
  hybridArray.meta = res.data?.meta;

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
