import { apiClient } from './client.js';

export const getGenerationsApi = async ({
  page = 1,
  limit = 20,
  type = null,
  status = null,
  search = '',
} = {}) => {
  const params = { page, limit };
  if (type && type !== 'all') params.type = type;
  if (status && status !== 'all') params.status = status;
  if (search && search.trim()) params.search = search.trim();

  return apiClient.get('/generations', { params });
};

export const getGenerationDetailApi = async (id) => {
  return apiClient.get(`/generations/${id}`);
};

export const deleteGenerationApi = async (id) => {
  return apiClient.delete(`/generations/${id}`);
};

export const getWorkspaceStatsApi = async () => {
  return apiClient.get('/generations/stats');
};
