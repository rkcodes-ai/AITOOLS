import KnowledgeCollection from '../models/knowledgeCollection.js';
import { getDBStatus } from '../config/database.js';
import { AppError, DatabaseError } from '../utils/errors.js';
import { escapeRegex } from '../utils/sanitize.js';

// In-memory collections store for offline development execution
const inMemoryCollections = new Map();

export const knowledgeCollectionRepository = {
  isReady() {
    return getDBStatus().connected;
  },

  _assertAvailable() {
    if (process.env.NODE_ENV === 'production' && !this.isReady()) {
      throw new DatabaseError('Database persistence is unavailable in production.');
    }
  },

  async create({ userId, name, description = '', documentIds = [] }) {
    if (!this.isReady()) {
      this._assertAvailable();
      const id = 'mem_col_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const col = {
        _id: id,
        id,
        userId: userId?.toString(),
        name: name.trim(),
        description: description.trim(),
        documentIds: documentIds.map((d) => d?.toString()),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryCollections.set(id, col);
      return { ...col };
    }
    return KnowledgeCollection.create({
      userId,
      name: name.trim(),
      description: description.trim(),
      documentIds,
      status: 'active',
    });
  },

  async findByIdForUser(id, userId) {
    if (!this.isReady()) {
      this._assertAvailable();
      const col = inMemoryCollections.get(id?.toString());
      if (col && col.userId === userId?.toString() && col.status !== 'deleted') {
        return { ...col };
      }
      return null;
    }
    return KnowledgeCollection.findOne({ _id: id, userId })
      .populate('documentIds', 'name originalFilename mimeType size status pageCount chunkCount')
      .lean();
  },

  async findManyForUser(userId, { page = 1, limit = 20, search = '', status = 'active' } = {}) {
    if (!this.isReady()) {
      this._assertAvailable();
      let cols = Array.from(inMemoryCollections.values()).filter(
        (c) => c.userId === userId?.toString() && c.status !== 'deleted'
      );
      if (status) {
        cols = cols.filter((c) => c.status === status);
      }
      if (search && search.trim()) {
        const lower = search.trim().toLowerCase();
        cols = cols.filter(
          (c) => c.name?.toLowerCase().includes(lower) || c.description?.toLowerCase().includes(lower)
        );
      }
      cols.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const total = cols.length;
      const skip = (Math.max(1, page) - 1) * limit;
      const paginated = cols.slice(skip, skip + limit);
      return {
        collections: paginated,
        total,
        page: Math.max(1, page),
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    }

    const query = { userId, status: { $ne: 'deleted' } };
    if (status) {
      query.status = status;
    }
    if (search && search.trim()) {
      const sanitized = escapeRegex(search.trim());
      query.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;
    const [collections, total] = await Promise.all([
      KnowledgeCollection.find(query)
        .populate('documentIds', 'name originalFilename mimeType size status pageCount chunkCount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      KnowledgeCollection.countDocuments(query),
    ]);

    return {
      collections,
      total,
      page: Math.max(1, page),
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  async updateForUser(id, userId, updates = {}) {
    if (!this.isReady()) {
      this._assertAvailable();
      const col = inMemoryCollections.get(id?.toString());
      if (!col || col.userId !== userId?.toString() || col.status === 'deleted') {
        throw new AppError('Knowledge collection not found or you are not authorized to update it.', 404, 'COLLECTION_NOT_FOUND');
      }
      if (updates.name) col.name = updates.name.trim();
      if (updates.description !== undefined) col.description = updates.description.trim();
      if (updates.documentIds) col.documentIds = updates.documentIds.map((d) => d?.toString());
      if (updates.status) col.status = updates.status;
      col.updatedAt = new Date();
      return { ...col };
    }

    const col = await KnowledgeCollection.findOneAndUpdate(
      { _id: id, userId, status: { $ne: 'deleted' } },
      { $set: updates },
      { new: true }
    )
      .populate('documentIds', 'name originalFilename mimeType size status pageCount chunkCount')
      .lean();

    if (!col) {
      throw new AppError('Knowledge collection not found or you are not authorized to update it.', 404, 'COLLECTION_NOT_FOUND');
    }
    return col;
  },

  async deleteForUser(id, userId) {
    if (!this.isReady()) {
      this._assertAvailable();
      const col = inMemoryCollections.get(id?.toString());
      if (!col || col.userId !== userId?.toString() || col.status === 'deleted') {
        throw new AppError('Knowledge collection not found or you are not authorized to delete it.', 404, 'COLLECTION_NOT_FOUND');
      }
      inMemoryCollections.delete(id?.toString());
      return { ...col };
    }

    const col = await KnowledgeCollection.findOneAndDelete({ _id: id, userId });
    if (!col) {
      throw new AppError('Knowledge collection not found or you are not authorized to delete it.', 404, 'COLLECTION_NOT_FOUND');
    }
    return col;
  },

  async addDocumentToCollection(collectionId, documentId, userId) {
    if (!this.isReady()) {
      this._assertAvailable();
      const col = inMemoryCollections.get(collectionId?.toString());
      if (!col || col.userId !== userId?.toString()) {
        throw new AppError('Collection not found.', 404, 'COLLECTION_NOT_FOUND');
      }
      const docStr = documentId?.toString();
      if (!col.documentIds.includes(docStr)) {
        col.documentIds.push(docStr);
      }
      return { ...col };
    }
    return KnowledgeCollection.findOneAndUpdate(
      { _id: collectionId, userId },
      { $addToSet: { documentIds: documentId } },
      { new: true }
    ).lean();
  },

  async removeDocumentFromCollection(collectionId, documentId, userId) {
    if (!this.isReady()) {
      this._assertAvailable();
      const col = inMemoryCollections.get(collectionId?.toString());
      if (!col || col.userId !== userId?.toString()) {
        throw new AppError('Collection not found.', 404, 'COLLECTION_NOT_FOUND');
      }
      const docStr = documentId?.toString();
      col.documentIds = col.documentIds.filter((id) => id !== docStr);
      return { ...col };
    }
    return KnowledgeCollection.findOneAndUpdate(
      { _id: collectionId, userId },
      { $pull: { documentIds: documentId } },
      { new: true }
    ).lean();
  },
};
