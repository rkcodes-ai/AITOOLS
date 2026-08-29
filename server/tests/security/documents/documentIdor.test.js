import { describe, it } from 'node:test';
import assert from 'node:assert';
import { documentService } from '../../../services/documents/documentService.js';
import { documentRepository } from '../../../repositories/documentRepository.js';

describe('Document IDOR Security Tests', () => {
  it('should reject unauthorized user trying to view another user document', async () => {
    const originalFind = documentRepository.findByIdForUser;

    documentRepository.findByIdForUser = async (id, userId) => {
      if (userId === 'user_victim_123') {
        return { _id: id, userId, name: 'Secret Financials.pdf', status: 'ready' };
      }
      return null;
    };

    try {
      await assert.rejects(
        async () => {
          await documentService.getDocumentDetails('doc_123', 'user_attacker_456');
        },
        (err) => {
          assert.strictEqual(err.status, 404);
          assert.strictEqual(err.code, 'DOCUMENT_NOT_FOUND');
          return true;
        }
      );
    } finally {
      documentRepository.findByIdForUser = originalFind;
    }
  });

  it('should reject unauthorized user trying to delete another user document', async () => {
    const originalFind = documentRepository.findByIdForUser;

    documentRepository.findByIdForUser = async (id, userId) => {
      if (userId === 'user_victim_123') {
        return { _id: id, userId, name: 'Secret.pdf', storageKey: 'doc_123.pdf' };
      }
      return null;
    };

    try {
      await assert.rejects(
        async () => {
          await documentService.deleteDocument('doc_123', 'user_attacker_456');
        },
        (err) => {
          assert.strictEqual(err.status, 404);
          return true;
        }
      );
    } finally {
      documentRepository.findByIdForUser = originalFind;
    }
  });
});
