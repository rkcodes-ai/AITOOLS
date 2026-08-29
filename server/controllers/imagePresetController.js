import {
  getUserPresetsService,
  createPresetService,
  updatePresetService,
  deletePresetService,
} from '../services/ai/imagePresetService.js';

export const getUserPresets = async (req, res, next) => {
  try {
    const presets = await getUserPresetsService(req.user.id);
    return res.status(200).json({
      success: true,
      data: presets,
    });
  } catch (error) {
    next(error);
  }
};

export const createPreset = async (req, res, next) => {
  try {
    const { name, configuration } = req.body;
    const preset = await createPresetService(req.user.id, { name, configuration });
    return res.status(201).json({
      success: true,
      data: preset,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePreset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, configuration } = req.body;
    const updated = await updatePresetService(id, req.user.id, { name, configuration });
    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePreset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deletePresetService(id, req.user.id);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
