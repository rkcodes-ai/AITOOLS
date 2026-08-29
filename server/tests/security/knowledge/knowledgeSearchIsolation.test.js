import { describe, it } from 'node:test';
import assert from 'node:assert';
import { knowledgeSearchService } from '../../../services/knowledge/knowledgeSearchService.js';
import { hybridRetriever } from '../../../services/knowledge/hybridRetriever.js';
import { documentRepository } from '../../../repositories/documentRepository.js';
import { documentChunkRepository } from '../../../repositories/documentChunkRepository.js';
import { knowledgeSearchCache } from '../../../services/knowledge/knowledgeSearchCache.js';

describe('Knowledge Search Multi-Tenant Isolation Security Tests', () => {
  it('should guarantee that User B search NEVER retrieves User A chunks', async () => {
    const origFindManyDocs = documentRepository.findManyForUser;
    const origFindDoc = documentRepository.findByIdForUser;
    const origFindChunks = documentChunkRepository.findChunksForUserAndDocuments;

    const userADocId = 'doc_user_a_secret';
    const userBDocId = 'doc_user_b_normal';

    // Mock document repository: returns only the caller's documents
    documentRepository.findManyForUser = async (userId) => {
      if (userId === 'user_b') {
        return {
          documents: [
            { _id: userBDocId, name: 'User B Public Notes.pdf', status: 'ready' },
          ],
        };
      }
      return {
        documents: [
          { _id: userADocId, name: 'User A Top Secret Financials.pdf', status: 'ready' },
        ],
      };
    };

    documentRepository.findByIdForUser = async (docId, userId) => {
      if (userId === 'user_b' && docId === userBDocId) {
        return { _id: userBDocId, name: 'User B Public Notes.pdf', status: 'ready' };
      }
      if (userId === 'user_a' && docId === userADocId) {
        return { _id: userADocId, name: 'User A Top Secret Financials.pdf', status: 'ready' };
      }
      return null;
    };

    // Mock chunks repository: verifies userId parameter is strictly used
    documentChunkRepository.findChunksForUserAndDocuments = async (userId, docIds) => {
      // In real MongoDB, this query has { userId, documentId: { $in: docIds } }
      if (userId === 'user_a') {
        return [
          {
            _id: 'chunk_secret_a',
            documentId: userADocId,
            userId: 'user_a',
            text: 'User A highly confidential financial revenues and quarterly secrets.',
            embedding: [0.99, 0.99],
          },
        ];
      }
      if (userId === 'user_b') {
        return [
          {
            _id: 'chunk_normal_b',
            documentId: userBDocId,
            userId: 'user_b',
            text: 'User B standard public guide on database normalization.',
            embedding: [0.1, 0.2],
          },
        ];
      }
      return [];
    };

    try {
      // User B searches for "financial revenues and secrets"
      const res = await knowledgeSearchService.search({
        userId: 'user_b',
        query: 'financial revenues and secrets',
        bypassCache: true,
      });

      // Assert that User B does NOT get User A's chunks
      const hasUserAChunk = res.results.some(
        (r) => r.documentId === userADocId || (r.snippet && r.snippet.includes('confidential'))
      );
      assert.strictEqual(
        hasUserAChunk,
        false,
        'CRITICAL SECURITY FAULT: User B search leaked User A private document chunks!'
      );
    } finally {
      documentRepository.findManyForUser = origFindManyDocs;
      documentRepository.findByIdForUser = origFindDoc;
      documentChunkRepository.findChunksForUserAndDocuments = origFindChunks;
    }
  });

  it('should guarantee cache isolation between different users with identical queries', () => {
    knowledgeSearchCache.clear();

    const secretPayloadA = {
      results: [{ snippet: 'USER A SECRET CLASSIFIED DATA' }],
    };
    const publicPayloadB = {
      results: [{ snippet: 'USER B PUBLIC TUTORIAL' }],
    };

    // User A executes query
    knowledgeSearchCache.set('user_a', 'q:machine_learning', secretPayloadA);
    // User B executes identical query
    knowledgeSearchCache.set('user_b', 'q:machine_learning', publicPayloadB);

    // Verify User B cannot access User A's cached entry
    const userBCached = knowledgeSearchCache.get('user_b', 'q:machine_learning');
    assert.deepStrictEqual(userBCached, publicPayloadB);
    assert.notDeepStrictEqual(userBCached, secretPayloadA);
  });
});
