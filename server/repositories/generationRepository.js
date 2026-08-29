import Generation from '../models/generation.js';
import { getDBStatus } from '../config/database.js';
import { AppError, DatabaseError } from '../utils/errors.js';
import { escapeRegex } from '../validators/postValidators.js';

// In-memory generation store for offline development execution
const inMemoryGenerations = new Map();

export const generationRepository = {
  isReady() {
    return getDBStatus().connected;
  },

  _assertAvailable() {
    if (process.env.NODE_ENV === 'production' && !this.isReady()) {
      throw new DatabaseError('Database persistence is unavailable in production.');
    }
  },

  async create(generationData) {
    if (!this.isReady()) {
      this._assertAvailable();
      const id = 'gen_mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const genObj = {
        _id: id,
        id,
        ...generationData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryGenerations.set(id, genObj);
      return { ...genObj };
    }
    return Generation.create(generationData);
  },

  _buildUserQuery({ userId, type, status, search }) {
    const query = { userId };

    if (type && type !== 'all') {
      query.type = type;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const sanitized = escapeRegex(search.trim().slice(0, 100));
      const searchRegex = new RegExp(sanitized, 'i');
      query.$or = [
        { prompt: searchRegex },
        { model: searchRegex },
        { provider: searchRegex },
      ];
    }

    return query;
  },

  async findPaginatedForUser({ userId, skip = 0, limit = 20, type = null, status = null, search = '' }) {
    if (!this.isReady()) {
      this._assertAvailable();
      let items = Array.from(inMemoryGenerations.values()).filter((g) => g.userId === userId?.toString());
      if (type && type !== 'all') {
        items = items.filter((g) => g.type === type);
      }
      if (status && status !== 'all') {
        items = items.filter((g) => g.status === status);
      }
      if (search && search.trim()) {
        const lower = search.trim().toLowerCase();
        items = items.filter(
          (g) =>
            g.prompt?.toLowerCase().includes(lower) ||
            g.model?.toLowerCase().includes(lower) ||
            g.input?.toLowerCase().includes(lower)
        );
      }
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return items.slice(skip, skip + limit).map((g) => ({ ...g }));
    }

    const query = this._buildUserQuery({ userId, type, status, search });

    return Generation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  },

  async countForUser({ userId, type = null, status = null, search = '' }) {
    if (!this.isReady()) {
      this._assertAvailable();
      let items = Array.from(inMemoryGenerations.values()).filter((g) => g.userId === userId?.toString());
      if (type && type !== 'all') {
        items = items.filter((g) => g.type === type);
      }
      if (status && status !== 'all') {
        items = items.filter((g) => g.status === status);
      }
      if (search && search.trim()) {
        const lower = search.trim().toLowerCase();
        items = items.filter(
          (g) =>
            g.prompt?.toLowerCase().includes(lower) ||
            g.model?.toLowerCase().includes(lower) ||
            g.input?.toLowerCase().includes(lower)
        );
      }
      return items.length;
    }

    const query = this._buildUserQuery({ userId, type, status, search });
    return Generation.countDocuments(query);
  },

  async findByIdForUser(id, userId) {
    if (!this.isReady()) {
      this._assertAvailable();
      const gen = inMemoryGenerations.get(id?.toString());
      if (gen && gen.userId === userId?.toString()) {
        return { ...gen };
      }
      return null;
    }

    return Generation.findOne({ _id: id, userId }).lean();
  },

  async deleteForUser(id, userId, isAdmin = false) {
    if (!this.isReady()) {
      this._assertAvailable();
      const gen = inMemoryGenerations.get(id?.toString());
      if (!gen || (!isAdmin && gen.userId !== userId?.toString())) {
        throw new AppError('Generation not found or you are not authorized to delete it.', 404, 'NOT_FOUND');
      }
      inMemoryGenerations.delete(id?.toString());
      return { ...gen };
    }

    const query = { _id: id };
    if (!isAdmin) {
      query.userId = userId;
    }

    const deleted = await Generation.findOneAndDelete(query);
    if (!deleted) {
      throw new AppError('Generation not found or you are not authorized to delete it.', 404, 'NOT_FOUND');
    }

    return deleted;
  },

  async aggregateUserStats(userId) {
    if (!this.isReady()) {
      this._assertAvailable();
      const userGens = Array.from(inMemoryGenerations.values()).filter((g) => g.userId === userId?.toString());
      return {
        total: userGens.length,
        images: userGens.filter((g) => g.type === 'image').length,
        summaries: userGens.filter((g) => g.type === 'summarize_url' || g.type === 'summarize_text').length,
        translations: userGens.filter((g) => g.type === 'translate').length,
        failed: userGens.filter((g) => g.status === 'failed').length,
      };
    }

    const [total, images, summaries, translations, failed] = await Promise.all([
      Generation.countDocuments({ userId }),
      Generation.countDocuments({ userId, type: 'image' }),
      Generation.countDocuments({ userId, type: { $in: ['summarize_url', 'summarize_text'] } }),
      Generation.countDocuments({ userId, type: 'translate' }),
      Generation.countDocuments({ userId, status: 'failed' }),
    ]);

    return {
      total,
      images,
      summaries,
      translations,
      failed,
    };
  },
};
