import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export const askQuestion = async (question, conversationId) => {
  const response = await api.post(`/ai/ask`, { question, conversationId });
  return response.data;
};

export const getConversations = async () => {
  const response = await api.get(`/ai/conversations`);
  return response.data;
};

export const getConversation = async (id) => {
  const response = await api.get(`/ai/conversations/${id}`);
  return response.data;
};
