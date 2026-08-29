import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { providerRegistry } from '../../../providers/registry/providerRegistry.js';
import { HuggingFaceImageAdapter } from '../../../providers/adapters/HuggingFaceImageAdapter.js';
import { RapidApiTextAdapter } from '../../../providers/adapters/RapidApiTextAdapter.js';
import { RapidApiTranslationAdapter } from '../../../providers/adapters/RapidApiTranslationAdapter.js';
import { HuggingFaceEmbeddingAdapter } from '../../../providers/adapters/HuggingFaceEmbeddingAdapter.js';
import { HuggingFaceChatAdapter } from '../../../providers/adapters/HuggingFaceChatAdapter.js';
import { ragService } from '../../../services/documents/ragService.js';
import { documentRepository } from '../../../repositories/documentRepository.js';
import { documentChunkRepository } from '../../../repositories/documentChunkRepository.js';
import { documentService } from '../../../services/documents/documentService.js';
import { ProviderConfigurationError, ProviderError } from '../../../providers/errors/providerErrors.js';
import { config } from '../../../config/env.js';

describe('AI Provider Production Fail-Fast & Fallback Policy Suite', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalHfToken = config.huggingface.token;
  const originalRapidKey = config.rapidapi.key;

  beforeEach(() => {
    config.huggingface.token = '';
    config.rapidapi.key = '';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    config.huggingface.token = originalHfToken;
    config.rapidapi.key = originalRapidKey;
  });

  describe('1. Image AI Provider (Hugging Face)', () => {
    it('should throw ProviderConfigurationError in production mode when HF_TOKEN is unconfigured', async () => {
      process.env.NODE_ENV = 'production';
      const adapter = new HuggingFaceImageAdapter();

      await assert.rejects(
        async () => {
          await adapter.generateImage({ prompt: 'A futuristic city', model: 'stabilityai/stable-diffusion-2-1' });
        },
        (err) => {
          assert.ok(err instanceof ProviderConfigurationError);
          assert.strictEqual(err.provider, 'huggingface');
          assert.ok(err.message.includes('HF_TOKEN is mandatory in production'));
          return true;
        }
      );
    });

    it('should allow development fallback generation when unconfigured', async () => {
      process.env.NODE_ENV = 'development';
      const adapter = new HuggingFaceImageAdapter();

      // Offline SVG fallback generator should produce a valid data URL
      const fallback = adapter._generateOfflineFallback('A futuristic city', 512, 512);
      assert.strictEqual(fallback.success, true);
      assert.ok(fallback.dataUrl.startsWith('data:image/svg+xml;base64,'));
    });
  });

  describe('2. Text AI Provider (RapidAPI)', () => {
    it('should throw ProviderConfigurationError in production mode for URL summarization when unconfigured', async () => {
      process.env.NODE_ENV = 'production';
      const adapter = new RapidApiTextAdapter();

      await assert.rejects(
        async () => {
          await adapter.summarizeUrl({ url: 'https://example.com/article' });
        },
        (err) => {
          assert.ok(err instanceof ProviderConfigurationError);
          assert.strictEqual(err.provider, 'rapidapi');
          assert.ok(err.message.includes('RAPID_API_KEY is mandatory in production'));
          return true;
        }
      );
    });

    it('should throw ProviderConfigurationError in production mode for Text summarization when unconfigured', async () => {
      process.env.NODE_ENV = 'production';
      const adapter = new RapidApiTextAdapter();

      await assert.rejects(
        async () => {
          await adapter.summarizeText({ text: 'This is a long test article text that needs summarizing.', action: 'Summarize' });
        },
        (err) => {
          assert.ok(err instanceof ProviderConfigurationError);
          assert.strictEqual(err.provider, 'rapidapi');
          assert.ok(err.message.includes('RAPID_API_KEY is mandatory in production'));
          return true;
        }
      );
    });

    it('should allow internal structural transformations (Rewrite, Explain, Improve, Analyze) in all environments', async () => {
      process.env.NODE_ENV = 'production';
      const adapter = new RapidApiTextAdapter();
      const sampleText = 'Artificial intelligence is very good due to the fact that it can process data rapidly.';

      const rewriteRes = await adapter.summarizeText({ text: sampleText, action: 'Rewrite' });
      assert.strictEqual(rewriteRes.action, 'Rewrite');
      assert.strictEqual(rewriteRes.provider, 'ai-transformer');
      assert.ok(rewriteRes.summary.length > 0);

      const explainRes = await adapter.summarizeText({ text: sampleText, action: 'Explain' });
      assert.strictEqual(explainRes.action, 'Explain');
      assert.ok(explainRes.summary.includes('Overview:'));

      const improveRes = await adapter.summarizeText({ text: sampleText, action: 'Improve' });
      assert.strictEqual(improveRes.action, 'Improve');

      const analyzeRes = await adapter.summarizeText({ text: sampleText, action: 'Analyze' });
      assert.strictEqual(analyzeRes.action, 'Analyze');
      assert.ok(analyzeRes.summary.includes('Textual Analysis Report'));
    });
  });

  describe('3. Translation Provider (RapidAPI)', () => {
    it('should throw ProviderConfigurationError in production mode when RAPID_API_KEY is unconfigured', async () => {
      process.env.NODE_ENV = 'production';
      const adapter = new RapidApiTranslationAdapter();

      await assert.rejects(
        async () => {
          await adapter.translateText({ text: 'Hello world', targetLang: 'es' });
        },
        (err) => {
          assert.ok(err instanceof ProviderConfigurationError);
          assert.strictEqual(err.provider, 'rapidapi');
          assert.ok(err.message.includes('RAPID_API_KEY is mandatory in production'));
          return true;
        }
      );
    });

    it('should allow development fallback translation when offline', async () => {
      process.env.NODE_ENV = 'development';
      const adapter = new RapidApiTranslationAdapter();

      const result = await adapter.translateText({ text: 'Welcome', targetLang: 'fr' });
      assert.strictEqual(result.targetLang, 'fr');
      assert.ok(result.translatedText);
      assert.strictEqual(result.usedFallback, true);
    });
  });

  describe('4. Embedding Provider (Hugging Face)', () => {
    it('should throw ProviderConfigurationError when HF_TOKEN is unconfigured', async () => {
      const adapter = new HuggingFaceEmbeddingAdapter();

      await assert.rejects(
        async () => {
          await adapter.embedText({ text: 'Machine learning fundamentals' });
        },
        (err) => {
          assert.ok(err instanceof ProviderConfigurationError);
          assert.strictEqual(err.provider, 'huggingface');
          return true;
        }
      );
    });
  });

  describe('5. RAG Chat / LLM Provider (Hugging Face)', () => {
    it('should throw ProviderConfigurationError when HF_TOKEN is unconfigured in production RAG query', async () => {
      process.env.NODE_ENV = 'production';
      const adapter = new HuggingFaceChatAdapter();

      await assert.rejects(
        async () => {
          await adapter.generateAnswer({
            messages: [{ role: 'user', content: 'What is the thesis?' }],
            context: 'Thesis document text...',
          });
        },
        (err) => {
          assert.ok(err instanceof ProviderConfigurationError);
          assert.strictEqual(err.provider, 'huggingface');
          return true;
        }
      );
    });

    it('should execute local grounded synthesis in development when chat provider is unconfigured', async () => {
      process.env.NODE_ENV = 'development';

      // Seed in-memory document & chunks for test user
      const doc = await documentRepository.create({
        name: 'Architecture Spec',
        userId: 'dev_user_999',
        status: 'ready',
      });

      await documentChunkRepository.bulkInsertChunks([
        {
          documentId: doc._id,
          userId: 'dev_user_999',
          chunkIndex: 0,
          pageStart: 1,
          pageEnd: 1,
          text: 'Step 1: Initialize database cluster.\nStep 2: Deploy microservices with health checks.\nStep 3: Enable monitoring.',
        },
      ]);

      const ragResponse = await ragService.answerQuestion({
        userId: 'dev_user_999',
        question: 'What are the deployment steps?',
        documentIds: [doc._id],
      });

      assert.strictEqual(ragResponse.status, 'completed');
      assert.strictEqual(ragResponse.usedRag, true);
      assert.ok(ragResponse.answer.includes('Architecture Spec'));
      assert.ok(ragResponse.answer.includes('Step 1'));
      assert.strictEqual(ragResponse.sources.length, 1);
    });
  });
});
