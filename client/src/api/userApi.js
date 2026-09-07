import apiClient from './client';

/**
 * User & Administrator Management REST API Module
 * Consumes /api/v1/admin and user endpoints
 */
export const userApi = {
  /**
   * Get all registered users (Admin only)
   */
  getUsers: async () => {
    const response = await apiClient.get('/admin/users');
    return response.data;
  },

  /**
   * Update user role (Admin only)
   * @param {string} userId
   * @param {string} role ('user' | 'admin')
   */
  updateUserRole: async (userId, role) => {
    const response = await apiClient.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  /**
   * Delete a user account (Admin only)
   * @param {string} userId
   */
  deleteUser: async (userId) => {
    const response = await apiClient.delete(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Get administrative summary statistics
   */
  getAdminStats: async () => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },

  /**
   * Get system health and connectivity indicators
   */
  getSystemHealth: async () => {
    const response = await apiClient.get('/admin/system-health');
    return response.data;
  },
};

export default userApi;
