import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getUserGenerationsService,
  getUserWorkspaceStatsService,
  recordGeneration,
} from '../../../services/ai/generationHistoryService.js';
import { generationRepository } from '../../../repositories/generationRepository.js';

describe('Generation History & Workspace Service Unit Tests', () => {
  it('should calculate pagination metadata correctly', async () => {
    const originalFind = generationRepository.findPaginatedForUser;
    const originalCount = generationRepository.countForUser;

    generationRepository.findPaginatedForUser = async () => [
      { _id: 'gen_1', prompt: 'a cat' },
      { _id: 'gen_2', prompt: 'a dog' },
    ];
    generationRepository.countForUser = async () => 45;

    try {
      const res = await getUserGenerationsService({
        userId: 'user_123',
        page: 2,
        limit: 20,
      });

      assert.strictEqual(res.generations.length, 2);
      assert.strictEqual(res.pagination.page, 2);
      assert.strictEqual(res.pagination.limit, 20);
      assert.strictEqual(res.pagination.total, 45);
      assert.strictEqual(res.pagination.totalPages, 3);
      assert.strictEqual(res.pagination.hasNext, true);
      assert.strictEqual(res.pagination.hasPrevious, true);
    } finally {
      generationRepository.findPaginatedForUser = originalFind;
      generationRepository.countForUser = originalCount;
    }
  });

  it('should return aggregated workspace statistics', async () => {
    const originalStats = generationRepository.aggregateUserStats;

    generationRepository.aggregateUserStats = async (userId) => ({
      total: 15,
      images: 10,
      summaries: 3,
      translations: 2,
      failed: 1,
    });

    try {
      const stats = await getUserWorkspaceStatsService('user_123');
      assert.strictEqual(stats.total, 15);
      assert.strictEqual(stats.images, 10);
      assert.strictEqual(stats.summaries, 3);
      assert.strictEqual(stats.translations, 2);
      assert.strictEqual(stats.failed, 1);
    } finally {
      generationRepository.aggregateUserStats = originalStats;
    }
  });

  it('should skip recording generation if userId is missing (anonymous mode)', async () => {
    const result = await recordGeneration({
      userId: null,
      type: 'image',
      provider: 'huggingface',
      prompt: 'a futuristic city',
    });

    assert.strictEqual(result, null);
  });
});
