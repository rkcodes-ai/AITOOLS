import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getGenerationDetailService,
  deleteGenerationService,
} from '../../../services/ai/generationHistoryService.js';
import { generationRepository } from '../../../repositories/generationRepository.js';

describe('Generation History IDOR & Authorization Security Tests', () => {
  it('should reject unauthorized user trying to view another user generation (IDOR protection)', async () => {
    const originalFindById = generationRepository.findByIdForUser;

    // Simulate repository scoping query to findByIdAndUserId: returns null when userId does not match
    generationRepository.findByIdForUser = async (id, userId) => {
      if (userId === 'user_victim_123') {
        return { _id: id, userId: 'user_victim_123', prompt: 'Secret prompt' };
      }
      return null;
    };

    try {
      await assert.rejects(
        async () => {
          await getGenerationDetailService({ id: 'gen_123', userId: 'user_attacker_456' });
        },
        (err) => {
          assert.strictEqual(err.status, 404);
          assert.strictEqual(err.code, 'NOT_FOUND');
          return true;
        }
      );
    } finally {
      generationRepository.findByIdForUser = originalFindById;
    }
  });

  it('should reject unauthorized user trying to delete another user generation', async () => {
    const originalDelete = generationRepository.deleteForUser;

    generationRepository.deleteForUser = async (id, userId, isAdmin) => {
      if (!isAdmin && userId !== 'user_victim_123') {
        const error = new Error('Generation not found or you are not authorized to delete it.');
        error.status = 404;
        error.code = 'NOT_FOUND';
        throw error;
      }
      return { _id: id };
    };

    try {
      await assert.rejects(
        async () => {
          await deleteGenerationService({
            id: 'gen_123',
            userId: 'user_attacker_456',
            role: 'user',
          });
        },
        (err) => {
          assert.strictEqual(err.status, 404);
          return true;
        }
      );
    } finally {
      generationRepository.deleteForUser = originalDelete;
    }
  });

  it('should permit deletion when performed by the rightful owner', async () => {
    const originalDelete = generationRepository.deleteForUser;

    let deletedId = null;
    generationRepository.deleteForUser = async (id, userId, isAdmin) => {
      deletedId = id;
      return { _id: id };
    };

    try {
      const res = await deleteGenerationService({
        id: 'gen_123',
        userId: 'user_victim_123',
        role: 'user',
      });

      assert.strictEqual(res.message, 'Generation deleted successfully.');
      assert.strictEqual(deletedId, 'gen_123');
    } finally {
      generationRepository.deleteForUser = originalDelete;
    }
  });

  it('should permit deletion when performed by an administrator', async () => {
    const originalDelete = generationRepository.deleteForUser;

    let wasAdmin = false;
    generationRepository.deleteForUser = async (id, userId, isAdmin) => {
      wasAdmin = isAdmin;
      return { _id: id };
    };

    try {
      const res = await deleteGenerationService({
        id: 'gen_123',
        userId: 'user_admin_999',
        role: 'admin',
      });

      assert.strictEqual(res.message, 'Generation deleted successfully.');
      assert.strictEqual(wasAdmin, true);
    } finally {
      generationRepository.deleteForUser = originalDelete;
    }
  });
});
