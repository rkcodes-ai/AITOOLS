import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { providerRegistry } from '../../../providers/registry/providerRegistry.js';
import { modelRegistry } from '../../../providers/registry/modelRegistry.js';
import { HuggingFaceImageAdapter } from '../../../providers/adapters/HuggingFaceImageAdapter.js';
import { RapidApiTextAdapter } from '../../../providers/adapters/RapidApiTextAdapter.js';
import { RapidApiTranslationAdapter } from '../../../providers/adapters/RapidApiTranslationAdapter.js';
import { HuggingFaceEmbeddingAdapter } from '../../../providers/adapters/HuggingFaceEmbeddingAdapter.js';
import { HuggingFaceChatAdapter } from '../../../providers/adapters/HuggingFaceChatAdapter.js';
import { documentRepository } from '../../../repositories/documentRepository.js';
import { documentChunkRepository } from '../../../repositories/documentChunkRepository.js';
import { ragService } from '../../../services/documents/ragService.js';
import { ProviderConfigurationError } from '../../../providers/errors/providerErrors.js';
import { config } from '../../../config/env.js';

describe('AI Provider Live Integration & Diagnostic Probe Suite', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('1. Provider Configuration & Sanitized Health Reporting', () => {
    it('should report provider status accurately without exposing credentials or keys', async () => {
      const health = await providerRegistry.getHealth();
      assert.ok(health);
      assert.ok('image_huggingface' in health);
      assert.ok('text_rapidapi' in health);
      assert.ok('translation_rapidapi' in health);
      assert.ok('embedding_huggingface' in health);
      assert.ok('chat_huggingface' in health);

      const serialized = JSON.stringify(health);
      assert.strictEqual(serialized.includes('Bearer'), false);
      assert.strictEqual(serialized.includes('X-RapidAPI-Key'), false);
      assert.strictEqual(serialized.includes('secret'), false);
    });
  });

  describe('2. Image AI Provider Runtime Verification', () => {
    it('should verify image provider adapter interface and parameter derivation', async () => {
      const adapter = providerRegistry.getImageProvider('huggingface');
      assert.ok(adapter);
      assert.strictEqual(adapter.name, 'huggingface');

      const isConfigured = adapter.isConfigured();
      if (isConfigured) {
        const start = Date.now();
        const res = await adapter.generateImage({
          prompt: 'A sleek modern minimal logo',
          model: 'stabilityai/stable-diffusion-2-1',
          options: { aspectRatio: '1:1', width: 512, height: 512 },
        });
        const elapsed = Date.now() - start;
        assert.ok(res.success);
        assert.ok(res.imageUrl.startsWith('data:image/'));
        assert.ok(elapsed > 0);
      } else {
        // When unconfigured in development, verify fallback generation is available
        const fallback = adapter._generateOfflineFallback('Test prompt', 512, 512);
        assert.strictEqual(fallback.success, true);
        assert.ok(fallback.dataUrl.startsWith('data:image/svg+xml;base64,'));
      }
    });
  });

  describe('3. Text AI Provider Runtime Verification', () => {
    it('should verify text summarization and transformation operations', async () => {
      const adapter = providerRegistry.getTextProvider('rapidapi');
      assert.ok(adapter);

      // Verify internal deterministic transformations
      const transformRes = await adapter.summarizeText({
        text: 'Artificial intelligence transforms automated workflows significantly and delivers exceptional productivity.',
        action: 'Rewrite',
      });
      assert.strictEqual(transformRes.action, 'Rewrite');
      assert.ok(transformRes.summary.length > 0);

      // Verify text summarization execution path
      if (adapter.isConfigured()) {
        const sumRes = await adapter.summarizeText({
          text: 'Deep learning is a subset of machine learning based on artificial neural networks. Representation learning allows a machine to be fed with raw data and automatically discover the representations needed for detection or classification. Deep learning methods are representation-learning methods with multiple levels of representation, obtained by composing simple but non-linear modules that each transform the representation at one level into a representation at a higher, slightly more abstract level.',
          percentage: 40,
          action: 'Summarize',
        });
        assert.ok(sumRes.summary);
      }
    });
  });

  describe('4. Translation Provider Runtime Verification', () => {
    it('should translate "Hello, welcome to AITOOLS." to Spanish ("es")', async () => {
      const adapter = providerRegistry.getTranslationProvider('rapidapi');
      assert.ok(adapter);

      const result = await adapter.translateText({
        text: 'Hello, welcome to AITOOLS.',
        targetLang: 'es',
        sourceLang: 'en',
      });

      assert.strictEqual(result.targetLang, 'es');
      assert.ok(result.translatedText);
      assert.ok(result.translatedText.length > 0);
    });
  });

  describe('5. Embedding Provider Runtime Verification', () => {
    it('should verify embedding adapter requirements and vector specifications', async () => {
      const adapter = providerRegistry.getEmbeddingProvider('huggingface');
      assert.ok(adapter);

      if (adapter.isConfigured()) {
        const result = await adapter.embedText({
          text: 'Document intelligence and semantic vector search',
          model: 'sentence-transformers/all-MiniLM-L6-v2',
        });
        assert.ok(Array.isArray(result.vector));
        assert.strictEqual(result.dimensions, 384);
      } else {
        process.env.NODE_ENV = 'production';
        await assert.rejects(
          async () => {
            await adapter.embedText({ text: 'Sample text' });
          },
          (err) => {
            assert.ok(err instanceof ProviderConfigurationError);
            return true;
          }
        );
      }
    });
  });

  describe('6. RAG LLM Chat & Grounding Verification', () => {
    it('should verify RAG chat grounded answer generation and source citations', async () => {
      process.env.NODE_ENV = 'development';
      const testUserId = 'live_test_user_' + Date.now();

      const doc = await documentRepository.create({
        name: 'Deployment Protocol',
        userId: testUserId,
        status: 'ready',
      });

      await documentChunkRepository.bulkInsertChunks([
        {
          documentId: doc._id,
          userId: testUserId,
          chunkIndex: 0,
          pageStart: 1,
          pageEnd: 1,
          text: 'Phase Alpha requires database connection validation.\nPhase Beta initializes the neural network models.',
        },
      ]);

      const result = await ragService.answerQuestion({
        userId: testUserId,
        question: 'What happens in Phase Alpha?',
        documentIds: [doc._id],
      });

      assert.strictEqual(result.status, 'completed');
      assert.strictEqual(result.usedRag, true);
      assert.ok(result.answer.includes('Phase Alpha') || result.answer.includes('database'));
      assert.strictEqual(result.sources.length, 1);
      assert.strictEqual(result.sources[0].documentName, 'Deployment Protocol');
    });
  });

  describe('7. Multi-Tenant User Isolation', () => {
    it('User B should not be able to retrieve or answer questions from User A document', async () => {
      process.env.NODE_ENV = 'development';
      const userAId = 'user_A_' + Date.now();
      const userBId = 'user_B_' + Date.now();

      const docA = await documentRepository.create({
        name: 'Confidential User A Document',
        userId: userAId,
        status: 'ready',
      });

      await documentChunkRepository.bulkInsertChunks([
        {
          documentId: docA._id,
          userId: userAId,
          chunkIndex: 0,
          pageStart: 1,
          pageEnd: 1,
          text: 'Top Secret Project Code: 994411.',
        },
      ]);

      // User B attempts to query User A's document
      const ragResponse = await ragService.answerQuestion({
        userId: userBId,
        question: 'What is the Top Secret Project Code?',
        documentIds: [docA._id],
      });

      // User B should get 0 sources and not see User A's content
      assert.strictEqual(ragResponse.sources.length, 0);
      assert.ok(ragResponse.answer.includes('No processed documents') || ragResponse.answer.includes("couldn't find"));
      assert.strictEqual(ragResponse.answer.includes('994411'), false);
    });
  });
});
