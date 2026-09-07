import validationApi from '../api/validationApi';

export const validateDocument = async (documentId) => {
  return validationApi.validateDocument(documentId);
};

export const getValidationResults = async (documentId) => {
  return validationApi.getValidationResults(documentId);
};

export const getValidationSummary = async (documentId) => {
  return validationApi.getValidationSummary(documentId);
};

export const resolveIssue = async (id, data) => {
  return validationApi.resolveIssue(id, data);
};

export default {
  validateDocument,
  getValidationResults,
  getValidationSummary,
  resolveIssue,
};
