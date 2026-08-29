import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateImageGenerationInput,
  validateSummarizeInput,
  validateTranslateInput,
} from '../../validators/aiValidators.js';
import {
  validateCreatePostInput,
  validateGetPostsInput,
  escapeRegex,
} from '../../validators/postValidators.js';
import { ValidationError } from '../../utils/errors.js';

describe('AI Validators Unit Tests', () => {
  it('should accept valid prompt and model', () => {
    const result = validateImageGenerationInput({
      prompt: 'A futuristic electric car',
      model: 'black-forest-labs/FLUX.1-schnell',
    });
    assert.strictEqual(result.prompt, 'A futuristic electric car');
    assert.strictEqual(result.model, 'black-forest-labs/FLUX.1-schnell');
  });

  it('should throw ValidationError on empty prompt', () => {
    assert.throws(
      () => validateImageGenerationInput({ prompt: '   ' }),
      (err) => {
        assert.ok(err instanceof ValidationError);
        assert.strictEqual(err.code, 'EMPTY_PROMPT');
        return true;
      }
    );
  });

  it('should throw ValidationError on long prompt', () => {
    assert.throws(
      () => validateImageGenerationInput({ prompt: 'x'.repeat(1005) }),
      (err) => {
        assert.ok(err instanceof ValidationError);
        assert.strictEqual(err.code, 'PROMPT_TOO_LONG');
        return true;
      }
    );
  });

  it('should validate summarization input and text action types', () => {
    const urlRes = validateSummarizeInput({ url: 'https://example.com' });
    assert.strictEqual(urlRes.url, 'https://example.com');
    assert.strictEqual(urlRes.action, 'Summarize');

    const textRes = validateSummarizeInput({
      text: 'This is a sufficiently long text for summarization and rewriting.',
      action: 'Rewrite',
    });
    assert.strictEqual(textRes.text, 'This is a sufficiently long text for summarization and rewriting.');
    assert.strictEqual(textRes.action, 'Rewrite');

    const explainRes = validateSummarizeInput({
      text: 'This is a sufficiently long text for explaining concepts.',
      action: 'Explain',
    });
    assert.strictEqual(explainRes.action, 'Explain');

    const fallbackRes = validateSummarizeInput({
      text: 'This is a sufficiently long text for analyzing text.',
      action: 'UnknownAction',
    });
    assert.strictEqual(fallbackRes.action, 'Summarize');
  });

  it('should throw ValidationError on missing summarization input', () => {
    assert.throws(
      () => validateSummarizeInput({}),
      (err) => {
        assert.ok(err instanceof ValidationError);
        assert.strictEqual(err.code, 'INVALID_INPUT');
        return true;
      }
    );
  });

  it('should validate translation input', () => {
    const transRes = validateTranslateInput({ text: 'Hello', targetLang: 'es' });
    assert.strictEqual(transRes.text, 'Hello');
    assert.strictEqual(transRes.targetLang, 'es');
  });

  it('should throw ValidationError on unsupported language', () => {
    assert.throws(
      () => validateTranslateInput({ text: 'Hello', targetLang: 'unsupported_lang' }),
      (err) => {
        assert.ok(err instanceof ValidationError);
        assert.strictEqual(err.code, 'UNSUPPORTED_LANGUAGE');
        return true;
      }
    );
  });
});

describe('Post Validators Unit Tests', () => {
  it('should validate complete post input', () => {
    const validFile = { mimetype: 'image/png', size: 1024 * 500 };
    const res = validateCreatePostInput({
      name: 'Alice',
      prompt: 'A scenic valley',
      model: 'stabilityai/stable-diffusion-2-1',
      file: validFile,
    });
    assert.strictEqual(res.name, 'Alice');
    assert.strictEqual(res.prompt, 'A scenic valley');
  });

  it('should throw on invalid file format', () => {
    const invalidFile = { mimetype: 'application/pdf', size: 1024 };
    assert.throws(
      () => validateCreatePostInput({ name: 'Alice', prompt: 'prompt', model: 'sd', file: invalidFile }),
      (err) => {
        assert.ok(err instanceof ValidationError);
        assert.strictEqual(err.code, 'INVALID_MIME_TYPE');
        return true;
      }
    );
  });

  it('should throw on oversized file', () => {
    const bigFile = { mimetype: 'image/jpeg', size: 12 * 1024 * 1024 };
    assert.throws(
      () => validateCreatePostInput({ name: 'Alice', prompt: 'prompt', model: 'sd', file: bigFile }),
      (err) => {
        assert.ok(err instanceof ValidationError);
        assert.strictEqual(err.code, 'FILE_TOO_LARGE');
        return true;
      }
    );
  });

  it('should sanitize pagination and search input', () => {
    const query = validateGetPostsInput({ page: '-5', limit: '500', search: 'cat.*' });
    assert.strictEqual(query.page, 1);
    assert.strictEqual(query.limit, 100);
    assert.strictEqual(query.search, 'cat\\.\\*');
  });
});
