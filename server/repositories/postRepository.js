import Post from '../models/post.js';
import { getDBStatus } from '../config/database.js';
import { DatabaseError } from '../utils/errors.js';

// In-memory post store for offline development execution
const inMemoryPosts = new Map();

export const postRepository = {
  isReady() {
    return getDBStatus().connected;
  },

  _assertAvailable() {
    if (process.env.NODE_ENV === 'production' && !this.isReady()) {
      throw new DatabaseError('Database persistence is unavailable in production.');
    }
  },

  async create(postData) {
    if (!this.isReady()) {
      this._assertAvailable();
      const id = 'mem_post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const post = {
        _id: id,
        id,
        name: postData.name,
        prompt: postData.prompt,
        photo: postData.photo,
        model: postData.model || 'FLUX.1-schnell',
        aspectRatio: postData.aspectRatio || '1:1',
        generationId: postData.generationId || null,
        likesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryPosts.set(id, post);
      return { ...post };
    }
    return Post.create(postData);
  },

  async findPaginated(query = {}, skip = 0, limit = 20) {
    if (!this.isReady()) {
      this._assertAvailable();
      let posts = Array.from(inMemoryPosts.values());
      posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return posts.slice(skip, skip + limit).map((p) => ({ ...p }));
    }
    return Post.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  },

  async count(query = {}) {
    if (!this.isReady()) {
      this._assertAvailable();
      return inMemoryPosts.size;
    }
    return Post.countDocuments(query);
  },

  async findById(id) {
    if (!this.isReady()) {
      this._assertAvailable();
      const p = inMemoryPosts.get(id?.toString());
      return p ? { ...p } : null;
    }
    return Post.findById(id).lean();
  },

  async deleteById(id) {
    if (!this.isReady()) {
      this._assertAvailable();
      const p = inMemoryPosts.get(id?.toString());
      if (p) {
        inMemoryPosts.delete(id?.toString());
        return { ...p };
      }
      return null;
    }
    return Post.findByIdAndDelete(id);
  },
};
