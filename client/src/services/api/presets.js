import { apiClient } from './client.js';

export const getPresetsApi = async () => {
  return apiClient.get('/image-presets');
};

export const createPresetApi = async ({ name, configuration }) => {
  return apiClient.post('/image-presets', { name, configuration });
};

export const updatePresetApi = async (id, { name, configuration }) => {
  return apiClient.patch(`/image-presets/${id}`, { name, configuration });
};

export const deletePresetApi = async (id) => {
  return apiClient.delete(`/image-presets/${id}`);
};
