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

export const askQuestion = async (question, conversationId) => {
  // Use the orchestrator endpoint as requested
  const response = await api.post(`/agents/orchestrate`, { 
    task: question, 
    context: { conversationId, source: 'ai-assistant' } 
  });
  
  // The orchestrator returns { success: true, data: { message, sources } }
  const result = response.data;
  
  return {
    answer: result.data?.message || result.message || 'Task completed successfully.',
    sources: result.data?.sources || [],
    conversationId: conversationId 
  };
};

export const getConversations = async () => {
  const response = await api.get(`/ai-assistant/conversations`);
  return response.data;
};

export const getConversation = async (id) => {
  const response = await api.get(`/ai-assistant/conversations/${id}`);
  return response.data;
};
