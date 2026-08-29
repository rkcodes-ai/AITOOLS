import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateImageGenerationInput } from '../../../validators/aiValidators.js';
import { ValidationError } from '../../../utils/errors.js';

describe('Image Studio Validators Unit Tests', () => {
  it('should accept valid advanced image generation parameters', () => {
    const res = validateImageGenerationInput({
      prompt: 'A cyberpunk cityscape at sunset with neon reflections',
      model: 'stabilityai/stable-diffusion-2-1',
      negativePrompt: 'blurry, lowres, distorted',
      aspectRatio: '16:9',
      guidanceScale: 8.5,
      steps: 35,
      seed: 42,
      quality: 'quality',
    });

    assert.strictEqual(res.prompt, 'A cyberpunk cityscape at sunset with neon reflections');
    assert.strictEqual(res.model, 'stabilityai/stable-diffusion-2-1');
    assert.strictEqual(res.negativePrompt, 'blurry, lowres, distorted');
    assert.strictEqual(res.aspectRatio, '16:9');
    assert.strictEqual(res.guidanceScale, 8.5);
    assert.strictEqual(res.steps, 35);
    assert.strictEqual(res.seed, 42);
    assert.strictEqual(res.quality, 'quality');
  });

  it('should reject empty prompt', () => {
    assert.throws(
      () => validateImageGenerationInput({ prompt: '   ' }),
      (err) => {
        assert.ok(err instanceof ValidationError);
        assert.strictEqual(err.code, 'EMPTY_PROMPT');
        return true;
      }
    );
  });

  it('should reject negative prompt exceeding 500 chars', () => {
    const longNegative = 'a'.repeat(501);
    assert.throws(
      () => validateImageGenerationInput({ prompt: 'valid prompt', negativePrompt: longNegative }),
      (err) => {
        assert.ok(err instanceof ValidationError);
        assert.strictEqual(err.code, 'NEGATIVE_PROMPT_TOO_LONG');
        return true;
      }
    );
  });

  it('should reject invalid seed (<0 or non-numeric)', () => {
    assert.throws(
      () => validateImageGenerationInput({ prompt: 'valid prompt', seed: -10 }),
      (err) => {
        assert.ok(err instanceof ValidationError);
        assert.strictEqual(err.code, 'INVALID_SEED');
        return true;
      }
    );
  });

  it('should reject out-of-range steps (>50)', () => {
    assert.throws(
      () => validateImageGenerationInput({ prompt: 'valid prompt', steps: 100 }),
      (err) => {
        assert.ok(err instanceof ValidationError);
        assert.strictEqual(err.code, 'INVALID_STEPS');
        return true;
      }
    );
  });

  it('should reject out-of-range guidance scale (>20)', () => {
    assert.throws(
      () => validateImageGenerationInput({ prompt: 'valid prompt', guidanceScale: 25.0 }),
      (err) => {
        assert.ok(err instanceof ValidationError);
        assert.strictEqual(err.code, 'INVALID_GUIDANCE_SCALE');
        return true;
      }
    );
  });

  it('should fallback to 1:1 for invalid aspect ratio', () => {
    const res = validateImageGenerationInput({
      prompt: 'valid prompt',
      aspectRatio: 'invalid:ratio',
    });
    assert.strictEqual(res.aspectRatio, '1:1');
  });
});
