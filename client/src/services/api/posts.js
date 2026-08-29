import { apiClient } from './client';

/**
 * Fetch community posts with optional pagination and search
 */
export const getPostsApi = async ({ page = 1, limit = 20, search = '' } = {}) => {
  return apiClient.get('/post', {
    params: { page, limit, search },
  });
};

/**
 * Create a new post with FormData
 */
export const createPostApi = async (formData) => {
  return apiClient.post('/post', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
