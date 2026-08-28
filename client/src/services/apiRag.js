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

export const indexDocument = async (documentId) => {
  const response = await api.post(`/rag/${documentId}/index`);
  return response.data;
};

export const searchKnowledgeBase = async (query) => {
  const response = await api.post(`/rag/search`, { query });
  return response.data;
};
