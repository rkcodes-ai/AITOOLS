import { describe, it } from 'node:test';
import assert from 'node:assert';
import { hybridRetriever } from '../../../services/knowledge/hybridRetriever.js';
import { documentRepository } from '../../../repositories/documentRepository.js';
import { documentChunkRepository } from '../../../repositories/documentChunkRepository.js';
import { knowledgeCollectionRepository } from '../../../repositories/knowledgeCollectionRepository.js';
import { providerRegistry } from '../../../providers/registry/providerRegistry.js';

describe('Hybrid Retriever Unit Tests', () => {
  it('should throw error if userId is missing', async () => {
    await assert.rejects(
      () => hybridRetriever.retrieve({ userId: null, query: 'test query' }),
      (err) => {
        assert.strictEqual(err.status, 401);
        return true;
      }
    );
  });

  it('should throw 404 if target collection does not exist or belongs to another user', async () => {
    const origFind = knowledgeCollectionRepository.findByIdForUser;
    knowledgeCollectionRepository.findByIdForUser = async () => null;

    try {
      await assert.rejects(
        () => hybridRetriever.retrieve({ userId: 'u_123', query: 'networks', collectionId: 'col_fake' }),
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

  it('should rank chunks by keyword and semantic scores with custom topK limit', async () => {
    const origFindCol = knowledgeCollectionRepository.findByIdForUser;
    const origFindDocs = documentRepository.findByIdForUser;
    const origFindManyDocs = documentRepository.findManyForUser;
    const origFindChunks = documentChunkRepository.findChunksForUserAndDocuments;
    const origGetEmbed = providerRegistry.getEmbeddingProvider;

    knowledgeCollectionRepository.findByIdForUser = async (id, userId) => ({
      _id: 'col_1',
      name: 'Databases',
      documentIds: ['doc_1'],
    });

    documentRepository.findByIdForUser = async (id) => ({
      _id: id,
      name: 'SQL Guide.pdf',
      originalFilename: 'sql_guide.pdf',
      mimeType: 'application/pdf',
      pageCount: 5,
      status: 'ready',
    });

    documentChunkRepository.findChunksForUserAndDocuments = async () => [
      {
        _id: 'chunk_1',
        documentId: 'doc_1',
        chunkIndex: 0,
        pageStart: 1,
        pageEnd: 1,
        text: 'An indexing technique optimizes query execution in relational database tables.',
        embedding: [0.9, 0.9, 0.9],
      },
      {
        _id: 'chunk_2',
        documentId: 'doc_1',
        chunkIndex: 1,
        pageStart: 2,
        pageEnd: 2,
        text: 'Unrelated text talking about vegetable gardening in spring.',
        embedding: [0.1, 0.1, 0.1],
      },
    ];

    providerRegistry.getEmbeddingProvider = () => ({
      name: 'mock-embedding',
      isConfigured: () => true,
      async embedText() {
        return { vector: [0.9, 0.9, 0.9], dimensions: 3, model: 'mock-embed' };
      },
    });

    try {
      const res = await hybridRetriever.retrieve({
        userId: 'user_123',
        query: 'relational database indexing',
        collectionId: 'col_1',
        topK: 1,
      });

      assert.strictEqual(res.results.length, 1);
      assert.strictEqual(res.results[0].chunkId, 'chunk_1');
      assert.strictEqual(res.results[0].rank, 1);
      assert.ok(res.results[0].finalScore > 0.5);
      assert.ok(res.results[0].explanation.includes('Databases'));
    } finally {
      knowledgeCollectionRepository.findByIdForUser = origFindCol;
      documentRepository.findByIdForUser = origFindDocs;
      documentRepository.findManyForUser = origFindManyDocs;
      documentChunkRepository.findChunksForUserAndDocuments = origFindChunks;
      providerRegistry.getEmbeddingProvider = origGetEmbed;
    }
  });
});
