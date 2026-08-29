import { describe, it } from 'node:test';
import assert from 'node:assert';
import { providerRegistry } from '../../../providers/registry/providerRegistry.js';
import { MockImageAdapter } from '../../../providers/adapters/MockImageAdapter.js';
import { ProviderError } from '../../../providers/errors/providerErrors.js';

describe('Provider Registry Unit Tests', () => {
  it('should retrieve registered huggingface image provider', () => {
    const provider = providerRegistry.getImageProvider('huggingface');
    assert.ok(provider);
    assert.strictEqual(provider.name, 'huggingface');
  });

  it('should retrieve registered rapidapi text provider', () => {
    const provider = providerRegistry.getTextProvider('rapidapi');
    assert.ok(provider);
    assert.strictEqual(provider.name, 'rapidapi');
  });

  it('should retrieve registered rapidapi translation provider', () => {
    const provider = providerRegistry.getTranslationProvider('rapidapi');
    assert.ok(provider);
    assert.strictEqual(provider.name, 'rapidapi');
  });

  it('should retrieve registered huggingface embedding provider', () => {
    const provider = providerRegistry.getEmbeddingProvider('huggingface');
    assert.ok(provider);
    assert.strictEqual(provider.name, 'huggingface');
  });

  it('should retrieve registered huggingface chat provider', () => {
    const provider = providerRegistry.getChatProvider('huggingface');
    assert.ok(provider);
    assert.strictEqual(provider.name, 'huggingface');
  });

  it('should throw ProviderError for unregistered provider name', () => {
    assert.throws(
      () => providerRegistry.getImageProvider('non_existent_provider'),
      (err) => {
        assert.ok(err instanceof ProviderError);
        assert.strictEqual(err.code, 'PROVIDER_NOT_REGISTERED');
        assert.strictEqual(err.status, 400);
        return true;
      }
    );
  });

  it('should allow registering and using a mock image provider dynamically', async () => {
    const mock = new MockImageAdapter('dynamic-test-provider');
    providerRegistry.registerImageProvider('dynamic-test-provider', mock);

    const retrieved = providerRegistry.getImageProvider('dynamic-test-provider');
    assert.strictEqual(retrieved.name, 'dynamic-test-provider');

    const genResult = await retrieved.generateImage({
      prompt: 'Test generation prompt',
      model: 'test-model',
    });

    assert.strictEqual(genResult.success, true);
    assert.strictEqual(genResult.provider, 'dynamic-test-provider');
    assert.ok(genResult.imageUrl.includes('mockImageDataForPrompt_'));
  });

  it('should aggregate provider health without leaking secrets', async () => {
    const health = await providerRegistry.getHealth();
    assert.ok(health.image_huggingface);
    assert.ok(health.text_rapidapi);
    assert.ok(health.translation_rapidapi);
    assert.ok(health.embedding_huggingface);
    assert.ok(health.chat_huggingface);

    // Verify secrets are NOT exposed
    const healthJson = JSON.stringify(health);
    assert.strictEqual(healthJson.includes('HF_TOKEN'), false);
    assert.strictEqual(healthJson.includes('RAPID_API_KEY'), false);
  });
});
