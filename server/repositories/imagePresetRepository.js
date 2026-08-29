import ImagePreset from '../models/imagePreset.js';
import { getDBStatus } from '../config/database.js';
import { AppError, DatabaseError } from '../utils/errors.js';

// In-memory image presets store for offline development execution
const inMemoryImagePresets = new Map();

export const imagePresetRepository = {
  isReady() {
    return getDBStatus().connected;
  },

  _assertAvailable() {
    if (process.env.NODE_ENV === 'production' && !this.isReady()) {
      throw new DatabaseError('Database persistence is unavailable in production.');
    }
  },

  async create({ userId, name, configuration }) {
    if (!this.isReady()) {
      this._assertAvailable();
      const id = 'mem_preset_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const preset = {
        _id: id,
        id,
        userId: userId?.toString(),
        name: name.trim(),
        configuration,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryImagePresets.set(id, preset);
      return { ...preset };
    }
    return ImagePreset.create({
      userId,
      name: name.trim(),
      configuration,
    });
  },

  async findByUserId(userId) {
    if (!this.isReady()) {
      this._assertAvailable();
      let presets = Array.from(inMemoryImagePresets.values()).filter((p) => p.userId === userId?.toString());
      presets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return presets.map((p) => ({ ...p }));
    }
    return ImagePreset.find({ userId }).sort({ createdAt: -1 }).lean();
  },

  async findByIdAndUserId(id, userId) {
    if (!this.isReady()) {
      this._assertAvailable();
      const preset = inMemoryImagePresets.get(id?.toString());
      if (preset && preset.userId === userId?.toString()) {
        return { ...preset };
      }
      return null;
    }
    return ImagePreset.findOne({ _id: id, userId }).lean();
  },

  async updateForUser(id, userId, { name, configuration }) {
    if (!this.isReady()) {
      this._assertAvailable();
      const preset = inMemoryImagePresets.get(id?.toString());
      if (!preset || preset.userId !== userId?.toString()) {
        throw new AppError('Image preset not found or you are not authorized to edit it.', 404, 'NOT_FOUND');
      }
      if (name) preset.name = name.trim();
      if (configuration) preset.configuration = configuration;
      preset.updatedAt = new Date();
      return { ...preset };
    }
    const update = {};
    if (name) update.name = name.trim();
    if (configuration) update.configuration = configuration;

    const updated = await ImagePreset.findOneAndUpdate(
      { _id: id, userId },
      update,
      { new: true }
    ).lean();

    if (!updated) {
      throw new AppError('Image preset not found or you are not authorized to edit it.', 404, 'NOT_FOUND');
    }
    return updated;
  },

  async deleteForUser(id, userId) {
    if (!this.isReady()) {
      this._assertAvailable();
      const preset = inMemoryImagePresets.get(id?.toString());
      if (!preset || preset.userId !== userId?.toString()) {
        throw new AppError('Image preset not found or you are not authorized to edit it.', 404, 'NOT_FOUND');
      }
      inMemoryImagePresets.delete(id?.toString());
      return { ...preset };
    }
    const deleted = await ImagePreset.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      throw new AppError('Image preset not found or you are not authorized to edit it.', 404, 'NOT_FOUND');
    }
    return deleted;
  },
};
