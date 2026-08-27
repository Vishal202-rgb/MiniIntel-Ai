import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export const validateDocument = async (documentId) => {
  const response = await api.post(`/documents/${documentId}/validate`);
  return response.data;
};

export const getValidationResults = async (documentId) => {
  const response = await api.get(`/documents/${documentId}/validation`);
  return response.data;
};

export const getValidationSummary = async () => {
  const response = await api.get(`/validation/summary`);
  return response.data;
};

export const resolveIssue = async (id, data) => {
  const response = await api.post(`/validation/issues/${id}/resolve`, data);
  return response.data;
};

export default {
  validateDocument,
  getValidationResults,
  getValidationSummary,
  resolveIssue
};
