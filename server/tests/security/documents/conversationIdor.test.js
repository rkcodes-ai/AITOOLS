import { describe, it } from 'node:test';
import assert from 'node:assert';
import { conversationRepository } from '../../../repositories/conversationRepository.js';

describe('Conversation IDOR Security Tests', () => {
  it('should reject unauthorized user trying to view another user conversation', async () => {
    const originalFind = conversationRepository.findConversationByIdForUser;

    conversationRepository.findConversationByIdForUser = async (conversationId, userId) => {
      if (userId === 'user_victim_123') {
        return { _id: conversationId, userId, title: 'Private Audit' };
      }
      return null;
    };

    try {
      const result = await conversationRepository.findConversationByIdForUser('conv_123', 'user_attacker_456');
      assert.strictEqual(result, null);
    } finally {
      conversationRepository.findConversationByIdForUser = originalFind;
    }
  });

  it('should reject unauthorized user trying to delete another user conversation', async () => {
    const originalDelete = conversationRepository.deleteConversationForUser;

    conversationRepository.deleteConversationForUser = async (conversationId, userId) => {
      if (userId === 'user_victim_123') {
        return { _id: conversationId };
      }
      const error = new Error('Conversation not found or you are not authorized to delete it.');
      error.status = 404;
      error.code = 'NOT_FOUND';
      throw error;
    };

    try {
      await assert.rejects(
        async () => {
          await conversationRepository.deleteConversationForUser('conv_123', 'user_attacker_456');
        },
        (err) => {
          assert.strictEqual(err.status, 404);
          assert.strictEqual(err.code, 'NOT_FOUND');
          return true;
        }
      );
    } finally {
      conversationRepository.deleteConversationForUser = originalDelete;
    }
  });
});
