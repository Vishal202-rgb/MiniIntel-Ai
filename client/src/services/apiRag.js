import knowledgeBaseApi from '../api/knowledgeBaseApi';

export const indexDocument = async (documentId) => {
  return knowledgeBaseApi.indexDocument(documentId);
};

export const searchKnowledgeBase = async (query) => {
  return knowledgeBaseApi.search(query);
};

export default {
  indexDocument,
  searchKnowledgeBase,
};
