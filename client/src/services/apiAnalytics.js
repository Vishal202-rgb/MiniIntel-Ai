import analyticsApi from '../api/analyticsApi';

export const getTrends = async () => {
  try {
    const res = await analyticsApi.getTrends();
    const data = res.data?.trends || res.data || [];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching trends from REST API:', error);
    return [];
  }
};

export const getAnomalies = async () => {
  try {
    const res = await analyticsApi.getAnomalies();
    const data = res.data?.anomalies || res.data || [];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching anomalies from REST API:', error);
    return [];
  }
};

export default {
  getTrends,
  getAnomalies,
};
