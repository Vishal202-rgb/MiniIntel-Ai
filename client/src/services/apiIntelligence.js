import intelligenceApi from '../api/intelligenceApi.js';

/**
 * High-level Intelligence API Service Adapter
 * Provides normalized, type-safe data access for intelligence features.
 */
export const getIntelligence = async (params) => {
  return intelligenceApi.getIntelligence(params);
};

export const analyze = async (data) => {
  return intelligenceApi.analyze(data);
};

export const getTrends = async (params) => {
  return intelligenceApi.getTrends(params);
};

export const getEntities = async (paramsOrDocId) => {
  return intelligenceApi.getEntities(paramsOrDocId);
};

export const getClusters = async (params) => {
  return intelligenceApi.getClusters(params);
};

export const getSimilarity = async (docIdOrParams) => {
  return intelligenceApi.getSimilarity(docIdOrParams);
};

export const getChanges = async (params) => {
  return intelligenceApi.getChanges(params);
};

export const linkEvidence = async (documentId, data) => {
  return intelligenceApi.linkEvidence(documentId, data);
};

export default {
  getIntelligence,
  analyze,
  getTrends,
  getEntities,
  getClusters,
  getSimilarity,
  getChanges,
  linkEvidence,
};
