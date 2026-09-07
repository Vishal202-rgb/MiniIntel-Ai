import apiClient from './client';

/**
 * Authentication REST API Module
 * Consumes /api/v1/auth endpoints
 */
export const authApi = {
  /**
   * Login with username and password
   * @param {string} username
   * @param {string} password
   */
  login: async (username, password) => {
    const response = await apiClient.post('/auth/login', { username, password });
    return response.data;
  },

  /**
   * Register a new user
   * @param {string} username
   * @param {string} email
   * @param {string} password
   */
  register: async (username, email, password) => {
    const response = await apiClient.post('/auth/register', { username, email, password });
    return response.data;
  },

  /**
   * Get currently authenticated user profile
   */
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  /**
   * Log out session
   */
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
  },
};

export default authApi;
