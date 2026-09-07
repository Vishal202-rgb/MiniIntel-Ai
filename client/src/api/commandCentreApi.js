import apiClient from './client';

/**
 * Command Centre & Real-time Operations REST API Module
 * Consumes /api/v1/command-centre endpoints
 */
export const commandCentreApi = {
  /**
   * Get operational command centre overview
   */
  getOverview: async () => {
    const response = await apiClient.get('/command-centre/overview');
    return response.data;
  },

  /**
   * Get pipeline processing status and queue depths
   */
  getPipeline: async () => {
    const response = await apiClient.get('/command-centre/pipeline');
    return response.data;
  },

  /**
   * Get system operational status
   */
  getStatus: async () => {
    const response = await apiClient.get('/command-centre/status');
    return response.data;
  },

  /**
   * Get items requiring human attention or action
   */
  getAttentionItems: async () => {
    const response = await apiClient.get('/command-centre/attention-items');
    return response.data;
  },

  /**
   * Get live command centre event activity stream
   */
  getActivity: async () => {
    const response = await apiClient.get('/command-centre/activity');
    return response.data;
  },
};

export default commandCentreApi;
