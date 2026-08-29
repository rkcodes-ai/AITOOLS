import { apiClient } from './client.js';

export const searchKnowledgeApi = async ({
  query,
  collectionId = null,
  documentIds = [],
  topK = 5,
  minSimilarity = 0.15,
  semanticWeight = 0.70,
  keywordWeight = 0.30,
  bypassCache = false,
}) => {
  return apiClient.post('/knowledge/search', {
    query,
    collectionId: collectionId || null,
    documentIds: documentIds || [],
    topK,
    minSimilarity,
    semanticWeight,
    keywordWeight,
    bypassCache,
  });
};

export const getCollectionsApi = async (params = {}) => {
  return apiClient.get('/knowledge/collections', { params });
};

export const getCollectionDetailsApi = async (id) => {
  return apiClient.get(`/knowledge/collections/${id}`);
};

export const createCollectionApi = async ({ name, description = '', documentIds = [] }) => {
  return apiClient.post('/knowledge/collections', {
    name,
    description,
    documentIds,
  });
};

export const updateCollectionApi = async (id, updates = {}) => {
  return apiClient.patch(`/knowledge/collections/${id}`, updates);
};

export const deleteCollectionApi = async (id) => {
  return apiClient.delete(`/knowledge/collections/${id}`);
};
