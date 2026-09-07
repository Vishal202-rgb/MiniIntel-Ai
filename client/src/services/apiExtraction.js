import extractionApi from '../api/extractionApi';

export const extractData = async (documentId) => {
  return extractionApi.extractData(documentId);
};

export const getExtractedRecords = async (documentId) => {
  return extractionApi.getExtractedRecords(documentId);
};

export const updateRecord = async (id, data) => {
  return extractionApi.updateRecord(id, data);
};

export const approveRecord = async (id) => {
  return extractionApi.approveRecord(id);
};

export const rejectRecord = async (id) => {
  return extractionApi.rejectRecord(id);
};

export const bulkApprove = async (ids) => {
  return extractionApi.bulkApprove(ids);
};

export default {
  extractData,
  getExtractedRecords,
  updateRecord,
  approveRecord,
  rejectRecord,
  bulkApprove,
};