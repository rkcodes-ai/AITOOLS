import { describe, it } from 'node:test';
import assert from 'node:assert';
import { cosineSimilarity, vectorStore } from '../../../services/documents/vectorStore.js';
import { documentChunkRepository } from '../../../repositories/documentChunkRepository.js';

describe('Vector Store & Cosine Similarity Unit Tests', () => {
  it('should compute exact cosine similarity values', () => {
    // Identical vectors -> 1.0
    const vecA = [1, 2, 3];
    const vecB = [1, 2, 3];
    assert.strictEqual(Math.round(cosineSimilarity(vecA, vecB)), 1);

    // Orthogonal vectors -> 0.0
    const vecOrth1 = [1, 0, 0];
    const vecOrth2 = [0, 1, 0];
    assert.strictEqual(cosineSimilarity(vecOrth1, vecOrth2), 0);

    // Opposing vectors -> -1.0
    const vecOpp1 = [1, 0];
    const vecOpp2 = [-1, 0];
    assert.strictEqual(Math.round(cosineSimilarity(vecOpp1, vecOpp2)), -1);
  });

  it('should search similar chunks with score threshold and topK limit', async () => {
    const originalFind = documentChunkRepository.findChunksForUserAndDocuments;

    documentChunkRepository.findChunksForUserAndDocuments = async (userId) => {
      return [
        {
          _id: 'chunk_1',
          documentId: 'doc_1',
          text: 'Architecture guidelines and backend layering',
          pageStart: 1,
          pageEnd: 1,
          embedding: [1, 0.9, 0.1],
        },
        {
          _id: 'chunk_2',
          documentId: 'doc_1',
          text: 'Unrelated recipe for chocolate cookies',
          pageStart: 2,
          pageEnd: 2,
          embedding: [-0.8, -0.9, 0.1],
        },
      ];
    };

    try {
      const results = await vectorStore.searchSimilarChunks({
        userId: 'user_123',
        queryVector: [1, 1, 0],
        topK: 1,
        minSimilarity: 0.5,
      });

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].chunkId, 'chunk_1');
      assert.ok(results[0].score > 0.8);
    } finally {
      documentChunkRepository.findChunksForUserAndDocuments = originalFind;
    }
  });
});
