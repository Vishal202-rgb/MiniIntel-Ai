// src/services/apiAnalytics.js
const mockTrends = [
  { name: 'Jan', production: 4000, target: 4500 },
  { name: 'Feb', production: 3000, target: 3500 },
  { name: 'Mar', production: 2000, target: 3000 },
  { name: 'Apr', production: 2780, target: 3500 },
  { name: 'May', production: 1890, target: 2000 },
  { name: 'Jun', production: 2390, target: 2500 },
  { name: 'Jul', production: 3490, target: 3000 },
];

const mockAnomalies = [
  { id: 1, date: '2023-05-15', severity: 'High', description: 'Significant drop in production at Site Alpha.' },
  { id: 2, date: '2023-06-22', severity: 'Medium', description: 'Unusual equipment downtime detected in Sector 4.' },
  { id: 3, date: '2023-07-01', severity: 'Low', description: 'Slight deviation in geological sampling data.' },
];

export const getTrends = async () => {
  return new Promise((resolve) => setTimeout(() => resolve(mockTrends), 500));
};

export const getAnomalies = async () => {
  return new Promise((resolve) => setTimeout(() => resolve(mockAnomalies), 500));
};
