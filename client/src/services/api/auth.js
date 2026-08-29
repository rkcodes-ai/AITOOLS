import { apiClient } from './client.js';

export const registerApi = async ({ name, email, password }) => {
  return apiClient.post('/auth/register', { name, email, password });
};

export const loginApi = async ({ email, password }) => {
  return apiClient.post('/auth/login', { email, password });
};

export const logoutApi = async () => {
  return apiClient.post('/auth/logout');
};

export const getMeApi = async () => {
  return apiClient.get('/auth/me');
};

export const changePasswordApi = async ({ currentPassword, newPassword }) => {
  return apiClient.post('/auth/change-password', { currentPassword, newPassword });
};
