import apiClient, { uploadFile, downloadFile } from './client';
import authApi from './authApi';
import userApi from './userApi';
import documentApi from './documentApi';
import extractionApi from './extractionApi';
import validationApi from './validationApi';
import knowledgeBaseApi from './knowledgeBaseApi';
import aiAssistantApi from './aiAssistantApi';
import analyticsApi from './analyticsApi';
import intelligenceApi from './intelligenceApi';
import topicsApi from './topicsApi';
import reportsApi from './reportsApi';
import reviewsApi from './reviewsApi';
import auditApi from './auditApi';
import dashboardApi from './dashboardApi';
import commandCentreApi from './commandCentreApi';
import settingsApi from './settingsApi';
import helpApi from './helpApi';
import notificationApi from './notificationApi';

export {
  apiClient,
  uploadFile,
  downloadFile,
  authApi,
  userApi,
  documentApi,
  extractionApi,
  validationApi,
  knowledgeBaseApi,
  aiAssistantApi,
  analyticsApi,
  intelligenceApi,
  topicsApi,
  reportsApi,
  reviewsApi,
  auditApi,
  dashboardApi,
  commandCentreApi,
  settingsApi,
  helpApi,
  notificationApi,
};

export default {
  client: apiClient,
  uploadFile,
  downloadFile,
  auth: authApi,
  user: userApi,
  document: documentApi,
  extraction: extractionApi,
  validation: validationApi,
  knowledgeBase: knowledgeBaseApi,
  aiAssistant: aiAssistantApi,
  analytics: analyticsApi,
  intelligence: intelligenceApi,
  topics: topicsApi,
  reports: reportsApi,
  reviews: reviewsApi,
  audit: auditApi,
  dashboard: dashboardApi,
  commandCentre: commandCentreApi,
  settings: settingsApi,
  help: helpApi,
  notifications: notificationApi,
};
