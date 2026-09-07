import apiClient from './client';

/**
 * User Preferences & System Settings REST API Module
 * Consumes /api/v1/settings endpoints
 */
export const settingsApi = {
  /**
   * Get all preferences for current user
   */
  getSettings: async () => {
    const response = await apiClient.get('/settings');
    return response.data;
  },

  /**
   * Update full preferences object
   * @param {object} data
   */
  updateSettings: async (data) => {
    const response = await apiClient.put('/settings', data);
    return response.data;
  },

  /**
   * Get preferred language
   */
  getLanguage: async () => {
    const response = await apiClient.get('/settings/language');
    return response.data;
  },

  /**
   * Update preferred language
   * @param {string|object} language
   */
  updateLanguage: async (language) => {
    const payload = typeof language === 'string' ? { language } : language;
    const response = await apiClient.put('/settings/language', payload);
    return response.data;
  },

  /**
   * Get appearance & theme settings
   */
  getAppearance: async () => {
    const response = await apiClient.get('/settings/appearance');
    return response.data;
  },

  /**
   * Update appearance & theme settings
   * @param {string|object} themeOrAppearance
   */
  updateAppearance: async (themeOrAppearance) => {
    const payload =
      typeof themeOrAppearance === 'string'
        ? { theme: themeOrAppearance }
        : themeOrAppearance;
    const response = await apiClient.put('/settings/appearance', payload);
    return response.data;
  },

  /**
   * Get notification preferences
   */
  getNotifications: async () => {
    const response = await apiClient.get('/settings/notifications');
    return response.data;
  },

  /**
   * Update notification preferences
   * @param {object} notifications - { emailNotifications, pushNotifications, reportAlerts, ... }
   */
  updateNotifications: async (notifications) => {
    const response = await apiClient.put('/settings/notifications', notifications);
    return response.data;
  },
};

export default settingsApi;
