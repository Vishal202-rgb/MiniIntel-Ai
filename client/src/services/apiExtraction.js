import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('userInfo');

  if (userInfo) {
    const { token } = JSON.parse(userInfo);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export const extractData = async (documentId) => {
  const response = await api.post(`/extraction/${documentId}/extract`);
  return response.data;
};

export const getExtractedRecords = async (documentId) => {
  const response = await api.get(`/extraction/${documentId}`);
  return response.data;
};

export const updateRecord = async (id, data) => {
  const response = await api.put(`/extraction/records/${id}`, data);
  return response.data;
};

export const approveRecord = async (id) => {
  const response = await api.post(`/extraction/records/${id}/approve`);
  return response.data;
};

export const rejectRecord = async (id) => {
  const response = await api.post(`/extraction/records/${id}/reject`);
  return response.data;
};

export const bulkApprove = async (ids) => {
  const response = await api.post(`/extraction/records/bulk-approve`, { ids });
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