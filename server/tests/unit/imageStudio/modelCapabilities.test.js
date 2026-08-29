import { describe, it } from 'node:test';
import assert from 'node:assert';
import { modelRegistry } from '../../../providers/registry/modelRegistry.js';

describe('Model Capability Registry Unit Tests', () => {
  it('should verify SD 2.1 supports negative prompts and guidance scale', () => {
    const model = modelRegistry.getImageModel('stabilityai/stable-diffusion-2-1');
    assert.strictEqual(model.capabilities.negativePrompt, true);
    assert.strictEqual(model.capabilities.seed, true);
    assert.strictEqual(model.capabilities.guidanceScale.supported, true);
    assert.ok(model.capabilities.dimensions['16:9']);
    assert.strictEqual(model.capabilities.dimensions['16:9'].width, 768);
    assert.strictEqual(model.capabilities.dimensions['16:9'].height, 432);
  });

  it('should verify FLUX schnell does not use negative prompting', () => {
    const model = modelRegistry.getImageModel('black-forest-labs/FLUX.1-schnell');
    assert.strictEqual(model.capabilities.negativePrompt, false);
    assert.strictEqual(model.capabilities.guidanceScale.supported, false);
    assert.strictEqual(model.capabilities.steps.max, 8);
    assert.strictEqual(model.capabilities.dimensions['1:1'].width, 1024);
  });

  it('should verify SDXL supports 1024x1024 native dimensions and quality presets', () => {
    const model = modelRegistry.getImageModel('stabilityai/stable-diffusion-xl-base-1.0');
    assert.strictEqual(model.capabilities.negativePrompt, true);
    assert.strictEqual(model.capabilities.dimensions['1:1'].width, 1024);
    assert.ok(model.capabilities.qualityPresets.quality);
    assert.strictEqual(model.capabilities.qualityPresets.quality.steps, 50);
  });
});
