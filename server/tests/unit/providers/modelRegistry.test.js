import { describe, it } from 'node:test';
import assert from 'node:assert';
import { modelRegistry } from '../../../providers/registry/modelRegistry.js';
import { ModelNotSupportedError } from '../../../providers/errors/providerErrors.js';

describe('Model Registry Unit Tests', () => {
  it('should list all enabled image models', () => {
    const models = modelRegistry.listImageModels();
    assert.ok(models.length >= 4);
    assert.ok(models.includes('stabilityai/stable-diffusion-2-1'));
    assert.ok(models.includes('black-forest-labs/FLUX.1-schnell'));
    assert.ok(models.includes('stabilityai/stable-diffusion-xl-base-1.0'));
    assert.ok(models.includes('runwayml/stable-diffusion-v1-5'));
  });

  it('should return metadata for a supported model', () => {
    const meta = modelRegistry.getImageModel('stabilityai/stable-diffusion-2-1');
    assert.strictEqual(meta.id, 'stabilityai/stable-diffusion-2-1');
    assert.strictEqual(meta.provider, 'huggingface');
    assert.strictEqual(meta.task, 'image-generation');
    assert.strictEqual(meta.enabled, true);
  });

  it('should throw ModelNotSupportedError for unknown model', () => {
    assert.throws(
      () => modelRegistry.getImageModel('unsupported/fake-model-xyz'),
      (err) => {
        assert.ok(err instanceof ModelNotSupportedError);
        assert.strictEqual(err.code, 'MODEL_NOT_SUPPORTED');
        assert.strictEqual(err.status, 400);
        return true;
      }
    );
  });

  it('should identify default and fallback image models correctly', () => {
    const defaultModel = modelRegistry.getDefaultImageModel();
    const fallbackModel = modelRegistry.getFallbackImageModel();

    assert.strictEqual(defaultModel.id, 'stabilityai/stable-diffusion-2-1');
    assert.strictEqual(fallbackModel.id, 'black-forest-labs/FLUX.1-schnell');
  });

  it('should list 13 supported languages', () => {
    const languages = modelRegistry.getLanguages();
    assert.strictEqual(languages.length, 13);
    const codes = languages.map((l) => l.code);
    assert.ok(codes.includes('en'));
    assert.ok(codes.includes('es'));
    assert.ok(codes.includes('fr'));
    assert.ok(codes.includes('ja'));
  });
});
