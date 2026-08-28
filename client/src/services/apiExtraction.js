import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    const { token } = JSON.parse(userInfo);
    config.headers.Authorization = Bearer ;
  }
  return config;
});

export const extractData = async (documentId) => {
  const response = await api.post(`/documents/${documentId}/extract`);
  return response.data;
};

export const getExtractedRecords = async (documentId) => {
  const response = await api.get(`/documents/${documentId}/records`);
  return response.data;
};

export const updateRecord = async (id, data) => {
  const response = await api.put(`/records/${id}`, data);
  return response.data;
};

export const approveRecord = async (id) => {
  const response = await api.post(`/records/${id}/approve`);
  return response.data;
};

export const rejectRecord = async (id) => {
  const response = await api.post(`/records/${id}/reject`);
  return response.data;
};

export const bulkApprove = async (ids) => {
  const response = await api.post(`/records/bulk-approve`, { ids });
  return response.data;
};

export default {
  extractData,
  getExtractedRecords,
  updateRecord,
  approveRecord,
  rejectRecord,
  bulkApprove
};
