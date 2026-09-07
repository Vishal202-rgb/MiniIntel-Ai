import aiAssistantApi from '../api/aiAssistantApi';
import apiClient from '../api/client';

export const askQuestion = (question, conversationId) => {
  return aiAssistantApi.askQuestion(question, conversationId);
};

export const getConversations = async () => {
  const response = await aiAssistantApi.getHistory();
  return response.data || response;
};

export const getConversation = async (id) => {
  const response = await aiAssistantApi.getHistoryById(id);
  return response.data || response;
};

export default {
  askQuestion,
  getConversations,
  getConversation,
};
