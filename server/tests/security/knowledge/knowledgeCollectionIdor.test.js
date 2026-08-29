import { describe, it } from 'node:test';
import assert from 'node:assert';
import { knowledgeSearchService } from '../../../services/knowledge/knowledgeSearchService.js';
import { knowledgeCollectionRepository } from '../../../repositories/knowledgeCollectionRepository.js';

describe('Knowledge Collection IDOR & Ownership Security Tests', () => {
  it('should reject unauthorized user trying to view another user collection', async () => {
    const origFind = knowledgeCollectionRepository.findByIdForUser;

    knowledgeCollectionRepository.findByIdForUser = async (id, userId) => {
      if (userId === 'user_victim_123') {
        return { _id: id, userId, name: 'Secret Architecture.pdf' };
      }
      return null;
    };

    try {
      await assert.rejects(
        () => knowledgeSearchService.getCollectionDetails('col_victim', 'user_attacker_456'),
        (err) => {
          assert.strictEqual(err.status, 404);
          assert.strictEqual(err.code, 'COLLECTION_NOT_FOUND');
          return true;
        }
      );
    } finally {
      knowledgeCollectionRepository.findByIdForUser = origFind;
    }
  });

  it('should reject unauthorized user trying to update another user collection', async () => {
    const origUpdate = knowledgeCollectionRepository.updateForUser;

    knowledgeCollectionRepository.updateForUser = async (id, userId, updates) => {
      if (userId !== 'user_victim_123') {
        const error = new Error('Collection not found or you are not authorized to update it.');
        error.status = 404;
        error.code = 'COLLECTION_NOT_FOUND';
        throw error;
      }
      return { _id: id, userId, ...updates };
    };

    try {
      await assert.rejects(
        () => knowledgeSearchService.updateCollection('col_victim', 'user_attacker_456', { name: 'Hacked' }),
        (err) => {
          assert.strictEqual(err.status, 404);
          assert.strictEqual(err.code, 'COLLECTION_NOT_FOUND');
          return true;
        }
      );
    } finally {
      knowledgeCollectionRepository.updateForUser = origUpdate;
    }
  });

  it('should reject unauthorized user trying to delete another user collection', async () => {
    const origDelete = knowledgeCollectionRepository.deleteForUser;

    knowledgeCollectionRepository.deleteForUser = async (id, userId) => {
      if (userId !== 'user_victim_123') {
        const error = new Error('Collection not found or you are not authorized to delete it.');
        error.status = 404;
        error.code = 'COLLECTION_NOT_FOUND';
        throw error;
      }
      return { _id: id, userId };
    };

    try {
      await assert.rejects(
        () => knowledgeSearchService.deleteCollection('col_victim', 'user_attacker_456'),
        (err) => {
          assert.strictEqual(err.status, 404);
          assert.strictEqual(err.code, 'COLLECTION_NOT_FOUND');
          return true;
        }
      );
    } finally {
      knowledgeCollectionRepository.deleteForUser = origDelete;
    }
  });
});
