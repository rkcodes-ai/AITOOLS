import DocumentChunk from '../models/documentChunk.js';
import { getDBStatus } from '../config/database.js';
import { DatabaseError } from '../utils/errors.js';

// In-memory chunk store for offline development execution
const inMemoryChunks = new Map();

export const documentChunkRepository = {
  isReady() {
    return getDBStatus().connected;
  },

  _assertAvailable() {
    if (process.env.NODE_ENV === 'production' && !this.isReady()) {
      throw new DatabaseError('Database persistence is unavailable in production.');
    }
  },

  async bulkInsertChunks(chunks) {
    if (!this.isReady()) {
      this._assertAvailable();
      if (!chunks || chunks.length === 0) return [];
      const saved = chunks.map((c, idx) => {
        const id = 'mem_chunk_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 6);
        const chunkObj = {
          _id: id,
          id,
          documentId: c.documentId?.toString(),
          userId: c.userId?.toString(),
          chunkIndex: c.chunkIndex,
          text: c.text,
          pageStart: c.pageStart,
          pageEnd: c.pageEnd,
          embedding: c.embedding || [],
          embeddingStatus: c.embeddingStatus || 'completed',
          tokenCount: c.tokenCount || 0,
          createdAt: new Date(),
        };
        inMemoryChunks.set(id, chunkObj);
        return chunkObj;
      });
      return saved;
    }
    if (!chunks || chunks.length === 0) return [];
    return DocumentChunk.insertMany(chunks);
  },

  async findChunksByDocumentId(documentId, userId) {
    if (!this.isReady()) {
      this._assertAvailable();
      const chunks = Array.from(inMemoryChunks.values())
        .filter((c) => c.documentId === documentId?.toString() && c.userId === userId?.toString())
        .sort((a, b) => a.chunkIndex - b.chunkIndex);
      return chunks.map((c) => ({ ...c }));
    }
    return DocumentChunk.find({ documentId, userId }).sort({ chunkIndex: 1 }).lean();
  },

  async findChunksForUserAndDocuments(userId, documentIds = []) {
    if (!this.isReady()) {
      this._assertAvailable();
      let chunks = Array.from(inMemoryChunks.values()).filter((c) => c.userId === userId?.toString());
      if (documentIds && documentIds.length > 0) {
        const idStrings = documentIds.map((id) => id?.toString());
        chunks = chunks.filter((c) => idStrings.includes(c.documentId));
      }
      return chunks.map((c) => ({ ...c }));
    }
    const query = { userId };
    if (documentIds && documentIds.length > 0) {
      query.documentId = { $in: documentIds };
    }
    return DocumentChunk.find(query).lean();
  },

  async deleteChunksByDocumentId(documentId, userId) {
    if (!this.isReady()) {
      this._assertAvailable();
      let count = 0;
      for (const [id, c] of inMemoryChunks.entries()) {
        if (c.documentId === documentId?.toString() && c.userId === userId?.toString()) {
          inMemoryChunks.delete(id);
          count++;
        }
      }
      return { deletedCount: count };
    }
    return DocumentChunk.deleteMany({ documentId, userId });
  },

  async updateChunkEmbedding(chunkId, userId, embedding) {
    if (!this.isReady()) {
      this._assertAvailable();
      const c = inMemoryChunks.get(chunkId?.toString());
      if (c && c.userId === userId?.toString()) {
        c.embedding = embedding;
        c.embeddingStatus = 'completed';
        return { modifiedCount: 1 };
      }
      return { modifiedCount: 0 };
    }
    return DocumentChunk.updateOne(
      { _id: chunkId, userId },
      { $set: { embedding, embeddingStatus: 'completed' } }
    );
  },
};
