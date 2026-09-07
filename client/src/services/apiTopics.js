import topicsApi from '../api/topicsApi';

export const getTopics = async (params) => {
  try {
    const data = await topicsApi.getTopics(params);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching topics from REST API:', error);
    return [];
  }
};

export default {
  getTopics,
};
