import apiClient from './client';

/**
 * Report Review & Approval Workflow REST API Module
 * Consumes /api/v1/reviews endpoints
 */
export const reviewsApi = {
  /**
   * Get all reports pending review
   * @param {object} [params]
   */
  getPendingReviews: async (params = {}) => {
    const response = await apiClient.get('/reviews/pending', { params });
    return response.data;
  },

  /**
   * Get review details for a specific report
   * @param {string} id
   */
  getReviewById: async (id) => {
    const response = await apiClient.get(`/reviews/${id}`);
    return response.data;
  },

  /**
   * Approve report (Admin only)
   * @param {string} id
   * @param {object} [data]
   */
  approveReview: async (id, data = {}) => {
    const response = await apiClient.post(`/reviews/${id}/approve`, data);
    return response.data;
  },

  /**
   * Reject report with comments (Admin/Reviewer)
   * @param {string} id
   * @param {string|object} commentsOrData
   */
  rejectReview: async (id, commentsOrData) => {
    const payload =
      typeof commentsOrData === 'string'
        ? { comments: commentsOrData }
        : commentsOrData;
    const response = await apiClient.post(`/reviews/${id}/reject`, payload);
    return response.data;
  },
};

export default reviewsApi;
