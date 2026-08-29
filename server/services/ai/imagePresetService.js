import { imagePresetRepository } from '../../repositories/imagePresetRepository.js';
import { ValidationError, AppError } from '../../utils/errors.js';

export const getUserPresetsService = async (userId) => {
  if (!userId) {
    throw new AppError('Authentication required to retrieve presets.', 401, 'UNAUTHORIZED');
  }
  return imagePresetRepository.findByUserId(userId);
};

export const createPresetService = async (userId, { name, configuration }) => {
  if (!userId) {
    throw new AppError('Authentication required to create presets.', 401, 'UNAUTHORIZED');
  }
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new ValidationError('Preset name is required.', 'EMPTY_PRESET_NAME');
  }
  if (name.trim().length > 100) {
    throw new ValidationError('Preset name cannot exceed 100 characters.', 'PRESET_NAME_TOO_LONG');
  }

  return imagePresetRepository.create({
    userId,
    name,
    configuration: configuration || {},
  });
};

export const updatePresetService = async (id, userId, { name, configuration }) => {
  if (!id || !userId) {
    throw new AppError('Preset ID and authentication required.', 400, 'INVALID_INPUT');
  }
  return imagePresetRepository.updateForUser(id, userId, { name, configuration });
};

export const deletePresetService = async (id, userId) => {
  if (!id || !userId) {
    throw new AppError('Preset ID and authentication required.', 400, 'INVALID_INPUT');
  }
  await imagePresetRepository.deleteForUser(id, userId);
  return { message: 'Image preset deleted successfully.' };
};
