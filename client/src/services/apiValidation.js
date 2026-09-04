import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    const { token } = JSON.parse(userInfo);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const validateDocument = async (documentId) => {
  const response = await api.post(`/validation/${documentId}/validate`);
  return response.data;
};

export const getValidationResults = async (documentId) => {
  const response = await api.get(`/documents/${documentId}/validation`);
  return response.data;
};

export const getValidationSummary = async (documentId) => {
  const url = documentId ? `/validation/summary?documentId=${documentId}` : `/validation/summary`;
  const response = await api.get(url);
  return response.data;
};

export const resolveIssue = async (id, data) => {
  const response = await api.put(`/validation/${id}/resolve`, data);
  return response.data;
};

export default {
  validateDocument,
  getValidationResults,
  getValidationSummary,
  resolveIssue
};
