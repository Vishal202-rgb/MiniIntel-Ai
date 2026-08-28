import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    const { token } = JSON.parse(userInfo);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const uploadDocument = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    }
  });
};

export const getDocuments = (params) => api.get('/documents', { params });
export const getDocumentById = (id) => api.get(`/documents/${id}`);
export const getDocumentStatus = (id) => api.get(`/documents/${id}/status`);
export const deleteDocument = (id) => api.delete(`/documents/${id}`);
export const retryDocument = (id) => api.post(`/documents/${id}/retry`);

export default api;
