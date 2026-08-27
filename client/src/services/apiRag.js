import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export const indexDocument = async (documentId) => {
  const response = await api.post(`/rag/index`, { documentId });
  return response.data;
};

export const searchKnowledgeBase = async (query) => {
  const response = await api.post(`/rag/search`, { query });
  return response.data;
};
