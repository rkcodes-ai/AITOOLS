import { describe, it } from 'node:test';
import assert from 'node:assert';
import { vectorStore } from '../../../services/documents/vectorStore.js';
import { documentChunkRepository } from '../../../repositories/documentChunkRepository.js';

describe('Vector Store Isolation Security Tests', () => {
  it('should guarantee that User A query NEVER retrieves User B vectors', async () => {
    const originalFind = documentChunkRepository.findChunksForUserAndDocuments;

    documentChunkRepository.findChunksForUserAndDocuments = async (userId) => {
      // Mock DB query with strict userId filter
      if (userId === 'user_attacker_456') {
        return [
          {
            _id: 'attacker_chunk_1',
            documentId: 'attacker_doc_1',
            userId: 'user_attacker_456',
            text: 'Public benign notes',
            embedding: [0.1, 0.1, 0.1],
          },
        ];
      }
      if (userId === 'user_victim_123') {
        return [
          {
            _id: 'victim_chunk_1',
            documentId: 'victim_doc_1',
            userId: 'user_victim_123',
            text: 'Extremely confidential business plans',
            embedding: [0.99, 0.99, 0.99],
          },
        ];
      }
      return [];
    };

    try {
      // Attacker executes vector query with exact matching vector for victim's confidential data
      const attackerResults = await vectorStore.searchSimilarChunks({
        userId: 'user_attacker_456',
        queryVector: [0.99, 0.99, 0.99],
        topK: 10,
        minSimilarity: 0.1,
      });

      // Attacker must only receive attacker chunks, 0 victim chunks
      assert.strictEqual(attackerResults.some((c) => c.chunkId === 'victim_chunk_1'), false);
    } finally {
      documentChunkRepository.findChunksForUserAndDocuments = originalFind;
    }
  });
});
