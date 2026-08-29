import { apiClient } from './client.js';

export const uploadDocumentApi = async (formData) => {
  return apiClient.post('/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getDocumentsApi = async ({ page = 1, limit = 20, search = '', status = null } = {}) => {
  const params = { page, limit };
  if (search) params.search = search;
  if (status) params.status = status;
  return apiClient.get('/documents', { params });
};

export const getDocumentDetailsApi = async (id) => {
  return apiClient.get(`/documents/${id}`);
};

export const retryProcessingApi = async (id) => {
  return apiClient.post(`/documents/${id}/process`);
};

export const deleteDocumentApi = async (id) => {
  return apiClient.delete(`/documents/${id}`);
};

export const chatWithDocumentsApi = async ({ question, documentIds = [], conversationId = null, model = null }) => {
  return apiClient.post('/documents/chat', {
    question,
    documentIds,
    conversationId,
    model,
  });
};
