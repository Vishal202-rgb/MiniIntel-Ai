import apiClient from './client';

/**
 * AI Assistant & Multi-Agent Orchestration REST API Module
 * Consumes /api/v1/ai-assistant and /api/v1/agents endpoints
 */
export const aiAssistantApi = {
  /**
   * Submit an AI query with RAG evidence and deterministic calculations
   * @param {object|string} payloadOrQuery
   */
  query: async (payloadOrQuery) => {
    const payload =
      typeof payloadOrQuery === 'string'
        ? { query: payloadOrQuery }
        : payloadOrQuery;
    const response = await apiClient.post('/ai-assistant/query', payload);
    return response.data;
  },

  /**
   * Ask assistant a question (alias for query)
   * @param {object|string} payloadOrQuestion
   */
  ask: async (payloadOrQuestion) => {
    const payload =
      typeof payloadOrQuestion === 'string'
        ? { query: payloadOrQuestion }
        : payloadOrQuestion;
    const response = await apiClient.post('/ai-assistant/ask', payload);
    return response.data;
  },

  /**
   * Helper function matching frontend AIAssistant page expectations
   * @param {string} question
   * @param {string} [conversationId]
   */
  askQuestion: async (question, conversationId) => {
    const response = await apiClient.post('/agents/orchestrate', {
      task: question,
      context: { conversationId, source: 'ai-assistant' },
    });
    const result = response.data;
    return {
      answer: result.data?.message || result.message || 'Task completed successfully.',
      sources: result.data?.sources || [],
      conversationId: conversationId,
    };
  },

  /**
   * Get conversational history
   * @param {object} [params]
   */
  getHistory: async (params = {}) => {
    const response = await apiClient.get('/ai-assistant/history', { params });
    return response.data;
  },

  /**
   * Get specific conversation history by ID
   * @param {string} id
   */
  getHistoryById: async (id) => {
    const response = await apiClient.get(`/ai-assistant/history/${id}`);
    return response.data;
  },

  /**
   * Delete conversation history item
   * @param {string} id
   */
  deleteHistory: async (id) => {
    const response = await apiClient.delete(`/ai-assistant/history/${id}`);
    return response.data;
  },

  /**
   * Multi-Agent Orchestrator endpoint
   * @param {string} task
   * @param {object} [context]
   */
  orchestrate: async (task, context = {}) => {
    const response = await apiClient.post('/agents/orchestrate', { task, context });
    return response.data;
  },
};

export default aiAssistantApi;
