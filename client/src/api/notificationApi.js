import apiClient from './client';

/**
 * Notifications REST API Module
 * Consumes /api/v1/notifications endpoints
 */
export const notificationApi = {
  /**
   * Get user notifications with unread count
   * @param {object} [params] - { unread, limit }
   */
  getNotifications: async (params = {}) => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  /**
   * Mark single notification as read
   * @param {string} id
   */
  markAsRead: async (id) => {
    const response = await apiClient.put(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllRead: async () => {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  }
};

export default notificationApi;
