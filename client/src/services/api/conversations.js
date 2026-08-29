import { apiClient } from './client.js';

export const getConversationsApi = async ({ page = 1, limit = 20 } = {}) => {
  return apiClient.get('/conversations', { params: { page, limit } });
};

export const getConversationDetailsApi = async (id) => {
  return apiClient.get(`/conversations/${id}`);
};

export const deleteConversationApi = async (id) => {
  return apiClient.delete(`/conversations/${id}`);
};
