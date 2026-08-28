import axios from 'axios';

const api = axios.create({
  baseURL: '/api/reports',
});

api.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    const { token } = JSON.parse(userInfo);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getReports = async () => {
  const response = await api.get('/');
  return response.data;
};

export const generateReport = async (data) => {
  const response = await api.post('/generate', data);
  return response.data;
};
