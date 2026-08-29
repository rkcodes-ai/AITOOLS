import Document from '../models/document.js';
import { getDBStatus } from '../config/database.js';
import { AppError, DatabaseError } from '../utils/errors.js';
import { escapeRegex } from '../utils/sanitize.js';

// In-memory document store for offline development execution
const inMemoryDocuments = new Map();

export const documentRepository = {
  isReady() {
    return getDBStatus().connected;
  },

  _assertAvailable() {
    if (process.env.NODE_ENV === 'production' && !this.isReady()) {
      throw new DatabaseError('Database persistence is unavailable in production.');
    }
  },

  async create(docData) {
    if (!this.isReady()) {
      this._assertAvailable();
      const id = 'mem_doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const newDoc = {
        _id: id,
        id,
        userId: docData.userId?.toString(),
        name: docData.name,
        originalFilename: docData.originalFilename,
        mimeType: docData.mimeType,
        size: docData.size,
        storageKey: docData.storageKey,
        checksum: docData.checksum,
        status: docData.status || 'uploaded',
        pageCount: docData.pageCount || 1,
        chunkCount: docData.chunkCount || 0,
        collectionIds: docData.collectionIds || [],
        metadata: docData.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryDocuments.set(id, newDoc);
      return newDoc;
    }
    return Document.create(docData);
  },

  async findByIdForUser(id, userId) {
    if (!this.isReady()) {
      this._assertAvailable();
      const doc = inMemoryDocuments.get(id?.toString());
      if (doc && doc.userId === userId?.toString() && doc.status !== 'deleted') {
        return { ...doc };
      }
      return null;
    }
    return Document.findOne({ _id: id, userId, status: { $ne: 'deleted' } }).lean();
  },

  async findManyForUser(userId, { page = 1, limit = 20, search = '', status = null } = {}) {
    if (!this.isReady()) {
      this._assertAvailable();
      let docs = Array.from(inMemoryDocuments.values()).filter(
        (d) => d.userId === userId?.toString() && d.status !== 'deleted'
      );
      if (status) {
        docs = docs.filter((d) => d.status === status);
      }
      if (search && search.trim()) {
        const lower = search.trim().toLowerCase();
        docs = docs.filter(
          (d) => d.name?.toLowerCase().includes(lower) || d.originalFilename?.toLowerCase().includes(lower)
        );
      }
      docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const total = docs.length;
      const skip = (Math.max(1, page) - 1) * limit;
      const paginated = docs.slice(skip, skip + limit);
      return {
        documents: paginated,
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
        { originalFilename: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;
    const [documents, total] = await Promise.all([
      Document.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Document.countDocuments(query),
    ]);

    return {
      documents,
      total,
      page: Math.max(1, page),
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  async findByChecksumForUser(checksum, userId) {
    if (!this.isReady()) {
      this._assertAvailable();
      const found = Array.from(inMemoryDocuments.values()).find(
        (d) => d.checksum === checksum && d.userId === userId?.toString() && d.status !== 'deleted'
      );
      return found ? { ...found } : null;
    }
    return Document.findOne({ checksum, userId, status: { $ne: 'deleted' } }).lean();
  },

  async updateStatus(id, userId, updates) {
    if (!this.isReady()) {
      this._assertAvailable();
      const doc = inMemoryDocuments.get(id?.toString());
      if (!doc || doc.userId !== userId?.toString()) {
        throw new AppError('Document not found or you are not authorized to update it.', 404, 'DOCUMENT_NOT_FOUND');
      }
      Object.assign(doc, updates, { updatedAt: new Date() });
      return { ...doc };
    }
    const doc = await Document.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true }
    ).lean();

    if (!doc) {
      throw new AppError('Document not found or you are not authorized to update it.', 404, 'DOCUMENT_NOT_FOUND');
    }
    return doc;
  },

  async deleteForUser(id, userId) {
    if (!this.isReady()) {
      this._assertAvailable();
      const doc = inMemoryDocuments.get(id?.toString());
      if (!doc || doc.userId !== userId?.toString()) {
        throw new AppError('Document not found or you are not authorized to delete it.', 404, 'DOCUMENT_NOT_FOUND');
      }
      inMemoryDocuments.delete(id?.toString());
      return { ...doc };
    }
    const doc = await Document.findOneAndDelete({ _id: id, userId });
    if (!doc) {
      throw new AppError('Document not found or you are not authorized to delete it.', 404, 'DOCUMENT_NOT_FOUND');
    }
    return doc;
  },

  async countForUser(userId) {
    if (!this.isReady()) {
      this._assertAvailable();
      return Array.from(inMemoryDocuments.values()).filter(
        (d) => d.userId === userId?.toString() && d.status !== 'deleted'
      ).length;
    }
    return Document.countDocuments({ userId, status: { $ne: 'deleted' } });
  },
};
