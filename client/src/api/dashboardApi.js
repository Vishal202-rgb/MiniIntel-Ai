import apiClient from './client';

/**
 * Main Dashboard REST API Module
 * Consumes /api/v1/dashboard endpoints
 */
export const dashboardApi = {
  /**
   * Get complete dashboard overview
   */
  getOverview: async () => {
    const response = await apiClient.get('/dashboard/overview');
    return response.data;
  },

  /**
   * Get operational KPIs
   */
  getKPIs: async () => {
    const response = await apiClient.get('/dashboard/kpis');
    return response.data;
  },

  /**
   * Get recent operational activity feed
   */
  getActivity: async () => {
    const response = await apiClient.get('/dashboard/activity');
    return response.data;
  },

  /**
   * Get system & threshold alerts
   */
  getAlerts: async () => {
    const response = await apiClient.get('/dashboard/alerts');
    return response.data;
  },

  /**
   * Get list of recently processed documents
   */
  getRecentDocuments: async () => {
    const response = await apiClient.get('/dashboard/recent-documents');
    return response.data;
  },
};

export default dashboardApi;
