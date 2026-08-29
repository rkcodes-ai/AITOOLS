export class KnowledgeSearchCache {
  constructor({ maxEntries = 200, ttlMs = 5 * 60 * 1000 } = {}) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
    this.store = new Map();
  }

  _buildKey(userId, queryKey) {
    return `${userId}:${queryKey}`;
  }

  get(userId, queryKey) {
    if (!userId || !queryKey) return null;
    const fullKey = this._buildKey(userId, queryKey);
    const entry = this.store.get(fullKey);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(fullKey);
      return null;
    }

    // Refresh LRU position
    this.store.delete(fullKey);
    this.store.set(fullKey, entry);

    return entry.value;
  }

  set(userId, queryKey, value) {
    if (!userId || !queryKey) return;
    const fullKey = this._buildKey(userId, queryKey);

    // Evict oldest entry if at capacity
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(fullKey, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  invalidateUser(userId) {
    if (!userId) return;
    const prefix = `${userId}:`;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear() {
    this.store.clear();
  }

  size() {
    return this.store.size;
  }
}

export const knowledgeSearchCache = new KnowledgeSearchCache();
