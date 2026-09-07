import reportsApi from '../api/reportsApi';

export const getReports = async (params) => {
  const response = await reportsApi.getReports(params);
  return response.data || response;
};

export const generateReport = async (data) => {
  const response = await reportsApi.generateReport(data);
  return response.data || response;
};

export const getReportById = async (id) => {
  const response = await reportsApi.getReportById(id);
  return response.data || response;
};

export const updateReport = async (id, data) => {
  const response = await reportsApi.updateReport(id, data);
  return response.data || response;
};

export const deleteReport = async (id) => {
  const response = await reportsApi.deleteReport(id);
  return response.data || response;
};

export const submitReview = async (id) => {
  const response = await reportsApi.submitReview(id);
  return response.data || response;
};

export const approveReport = async (id) => {
  const response = await reportsApi.approveReport(id);
  return response.data || response;
};

export const rejectReport = async (id, comments) => {
  const response = await reportsApi.rejectReport(id, comments);
  return response.data || response;
};

export default {
  getReports,
  generateReport,
  getReportById,
  updateReport,
  deleteReport,
  submitReview,
  approveReport,
  rejectReport,
  exportPdf: reportsApi.exportPdf,
  exportDocx: reportsApi.exportDocx,
  exportCsv: reportsApi.exportCsv,
  exportJson: reportsApi.exportJson,
};
