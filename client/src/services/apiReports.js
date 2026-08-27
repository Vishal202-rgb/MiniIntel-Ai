// src/services/apiReports.js
export const getReports = async () => {
  return new Promise((resolve) => setTimeout(() => resolve([]), 500));
};

export const generateReport = async (data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: Math.floor(Math.random() * 1000),
        type: data.type,
        date: new Date().toISOString(),
        content: `Generated report content for ${data.type} report. This includes summary statistics and AI-driven insights based on recent data from the specified sectors and date ranges.`,
        status: 'completed'
      });
    }, 1500);
  });
};
