import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  updatePresetService,
  deletePresetService,
} from '../../../services/ai/imagePresetService.js';
import { imagePresetRepository } from '../../../repositories/imagePresetRepository.js';

describe('Image Preset IDOR & Security Tests', () => {
  it('should reject unauthorized user trying to edit another user preset (IDOR protection)', async () => {
    const originalUpdate = imagePresetRepository.updateForUser;

    imagePresetRepository.updateForUser = async (id, userId, update) => {
      if (userId === 'user_victim_123') {
        return { _id: id, userId, ...update };
      }
      const error = new Error('Image preset not found or you are not authorized to edit it.');
      error.status = 404;
      error.code = 'NOT_FOUND';
      throw error;
    };

    try {
      await assert.rejects(
        async () => {
          await updatePresetService('preset_123', 'user_attacker_456', { name: 'Hacked Preset' });
        },
        (err) => {
          assert.strictEqual(err.status, 404);
          assert.strictEqual(err.code, 'NOT_FOUND');
          return true;
        }
      );
    } finally {
      imagePresetRepository.updateForUser = originalUpdate;
    }
  });

  it('should reject unauthorized user trying to delete another user preset', async () => {
    const originalDelete = imagePresetRepository.deleteForUser;

    imagePresetRepository.deleteForUser = async (id, userId) => {
      if (userId === 'user_victim_123') {
        return { _id: id };
      }
      const error = new Error('Image preset not found or you are not authorized to delete it.');
      error.status = 404;
      error.code = 'NOT_FOUND';
      throw error;
    };

    try {
      await assert.rejects(
        async () => {
          await deletePresetService('preset_123', 'user_attacker_456');
        },
        (err) => {
          assert.strictEqual(err.status, 404);
          return true;
        }
      );
    } finally {
      imagePresetRepository.deleteForUser = originalDelete;
    }
  });

  it('should permit updating when performed by the rightful preset owner', async () => {
    const originalUpdate = imagePresetRepository.updateForUser;

    imagePresetRepository.updateForUser = async (id, userId, update) => {
      return { _id: id, userId, name: update.name };
    };

    try {
      const res = await updatePresetService('preset_123', 'user_victim_123', {
        name: 'My Best SDXL Preset',
      });
      assert.strictEqual(res.name, 'My Best SDXL Preset');
    } finally {
      imagePresetRepository.updateForUser = originalUpdate;
    }
  });
});
