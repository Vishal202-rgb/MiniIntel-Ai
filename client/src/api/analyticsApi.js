import apiClient from './client';

/**
 * Mining Analytics & Insights REST API Module
 * Consumes /api/v1/analytics endpoints
 */
export const analyticsApi = {
  /**
   * Get high-level analytics overview
   */
  getOverview: async () => {
    const response = await apiClient.get('/analytics/overview');
    return response.data;
  },

  /**
   * Get key performance indicators
   */
  getKPIs: async () => {
    const response = await apiClient.get('/analytics/kpis');
    return response.data;
  },

  /**
   * Get production analytics by mine, period, or subsidiary
   * @param {object} [params]
   */
  getProduction: async (params = {}) => {
    const response = await apiClient.get('/analytics/production', { params });
    return response.data;
  },

  /**
   * Get coal dispatch and transportation analytics
   * @param {object} [params]
   */
  getDispatch: async (params = {}) => {
    const response = await apiClient.get('/analytics/dispatch', { params });
    return response.data;
  },

  /**
   * Get historical trends
   * @param {object} [params]
   */
  getTrends: async (params = {}) => {
    const response = await apiClient.get('/analytics/trends', { params });
    return response.data;
  },

  /**
   * Get target vs actual variance analysis
   * @param {object} [params]
   */
  getVariance: async (params = {}) => {
    const response = await apiClient.get('/analytics/variance', { params });
    return response.data;
  },

  /**
   * Get detected anomalies and statistical outliers
   * @param {object} [params]
   */
  getAnomalies: async (params = {}) => {
    const response = await apiClient.get('/analytics/anomalies', { params });
    return response.data;
  },

  /**
   * Get comprehensive dashboard metrics for Analytics page
   */
  getDashboard: async () => {
    const response = await apiClient.get('/analytics/dashboard');
    return response.data;
  },
};

export default analyticsApi;
