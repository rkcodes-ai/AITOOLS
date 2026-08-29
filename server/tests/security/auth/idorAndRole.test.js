import { describe, it } from 'node:test';
import assert from 'node:assert';
import { deletePostService } from '../../../services/posts/postService.js';
import { postRepository } from '../../../repositories/postRepository.js';

describe('Auth IDOR & Role Authorization Tests', () => {
  it('should reject unauthenticated delete attempt', async () => {
    await assert.rejects(
      async () => {
        await deletePostService('post_123', null);
      },
      (err) => {
        assert.strictEqual(err.status, 401);
        assert.strictEqual(err.code, 'UNAUTHORIZED');
        return true;
      }
    );
  });

  it('should reject delete attempt by non-owner user (IDOR protection)', async () => {
    // Mock findById on postRepository
    const originalFindById = postRepository.findById;
    postRepository.findById = async (id) => ({
      _id: id,
      name: 'Owner User',
      userId: 'user_owner_123',
      photo: 'https://example.com/img.jpg',
    });

    const maliciousUser = {
      id: 'user_attacker_456',
      role: 'user',
    };

    try {
      await assert.rejects(
        async () => {
          await deletePostService('post_123', maliciousUser);
        },
        (err) => {
          assert.strictEqual(err.status, 403);
          assert.strictEqual(err.code, 'FORBIDDEN');
          assert.ok(err.message.includes('not authorized'));
          return true;
        }
      );
    } finally {
      postRepository.findById = originalFindById;
    }
  });

  it('should permit post deletion by the rightful owner', async () => {
    const originalFindById = postRepository.findById;
    const originalDeleteById = postRepository.deleteById;

    let deletedId = null;
    postRepository.findById = async (id) => ({
      _id: id,
      name: 'Owner User',
      userId: 'user_owner_123',
      photo: 'https://example.com/img.jpg',
    });
    postRepository.deleteById = async (id) => {
      deletedId = id;
      return { _id: id };
    };

    const rightfulOwner = {
      id: 'user_owner_123',
      role: 'user',
    };

    try {
      const res = await deletePostService('post_123', rightfulOwner);
      assert.strictEqual(res.message, 'Post deleted successfully.');
      assert.strictEqual(deletedId, 'post_123');
    } finally {
      postRepository.findById = originalFindById;
      postRepository.deleteById = originalDeleteById;
    }
  });

  it('should permit post deletion by an admin regardless of ownership', async () => {
    const originalFindById = postRepository.findById;
    const originalDeleteById = postRepository.deleteById;

    let deletedId = null;
    postRepository.findById = async (id) => ({
      _id: id,
      name: 'Regular User',
      userId: 'user_regular_123',
      photo: 'https://example.com/img.jpg',
    });
    postRepository.deleteById = async (id) => {
      deletedId = id;
      return { _id: id };
    };

    const adminUser = {
      id: 'user_admin_999',
      role: 'admin',
    };

    try {
      const res = await deletePostService('post_123', adminUser);
      assert.strictEqual(res.message, 'Post deleted successfully.');
      assert.strictEqual(deletedId, 'post_123');
    } finally {
      postRepository.findById = originalFindById;
      postRepository.deleteById = originalDeleteById;
    }
  });
});
