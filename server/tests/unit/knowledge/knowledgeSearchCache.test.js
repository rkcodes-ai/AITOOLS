import { describe, it } from 'node:test';
import assert from 'node:assert';
import { KnowledgeSearchCache } from '../../../services/knowledge/knowledgeSearchCache.js';

describe('Knowledge Search Cache Unit Tests', () => {
  it('should store and retrieve cached results scoped strictly to user', () => {
    const cache = new KnowledgeSearchCache({ maxEntries: 10, ttlMs: 60000 });

    cache.set('user_1', 'query_db', { results: ['chunk_1'] });
    cache.set('user_2', 'query_db', { results: ['chunk_2'] });

    const cached1 = cache.get('user_1', 'query_db');
    const cached2 = cache.get('user_2', 'query_db');

    assert.deepStrictEqual(cached1, { results: ['chunk_1'] });
    assert.deepStrictEqual(cached2, { results: ['chunk_2'] });
  });

  it('should return null for expired cache entries', async () => {
    const cache = new KnowledgeSearchCache({ maxEntries: 10, ttlMs: 20 });
    cache.set('user_1', 'temp_query', { data: 123 });

    await new Promise((r) => setTimeout(r, 35));

    const result = cache.get('user_1', 'temp_query');
    assert.strictEqual(result, null);
  });

  it('should evict oldest entry when capacity is reached (LRU)', () => {
    const cache = new KnowledgeSearchCache({ maxEntries: 2, ttlMs: 60000 });

    cache.set('u1', 'k1', 1);
    cache.set('u1', 'k2', 2);
    // Access k1 to make it newer than k2
    cache.get('u1', 'k1');
    // Add third item -> k2 should be evicted
    cache.set('u1', 'k3', 3);

    assert.strictEqual(cache.get('u1', 'k1'), 1);
    assert.strictEqual(cache.get('u1', 'k2'), null);
    assert.strictEqual(cache.get('u1', 'k3'), 3);
  });

  it('should invalidate all cache entries for a specific user upon updates', () => {
    const cache = new KnowledgeSearchCache({ maxEntries: 10, ttlMs: 60000 });

    cache.set('user_victim', 'search_1', { data: 1 });
    cache.set('user_victim', 'search_2', { data: 2 });
    cache.set('user_other', 'search_1', { data: 99 });

    cache.invalidateUser('user_victim');

    assert.strictEqual(cache.get('user_victim', 'search_1'), null);
    assert.strictEqual(cache.get('user_victim', 'search_2'), null);
    assert.deepStrictEqual(cache.get('user_other', 'search_1'), { data: 99 });
  });
});
