import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateImageService, SUPPORTED_IMAGE_MODELS } from '../services/ai/imageService.js';
import {
  summarizeFromUrlService,
  summarizeFromTextService,
  translateTextService,
  SUPPORTED_LANGUAGES,
} from '../services/ai/textService.js';
import { getPostsService, createPostService } from '../services/posts/postService.js';

describe('AI Services Validation Tests', () => {
  it('should list all supported image generation models', () => {
    assert.ok(SUPPORTED_IMAGE_MODELS.length >= 3);
    assert.ok(SUPPORTED_IMAGE_MODELS.includes('stabilityai/stable-diffusion-2-1'));
    assert.ok(SUPPORTED_IMAGE_MODELS.includes('black-forest-labs/FLUX.1-schnell'));
  });

  it('should reject empty prompt in image generation', async () => {
    await assert.rejects(
      async () => {
        await generateImageService({ prompt: '' });
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.ok(err.message.includes('Prompt is required'));
        return true;
      }
    );
  });

  it('should reject excessively long prompt in image generation', async () => {
    const longPrompt = 'a'.repeat(1005);
    await assert.rejects(
      async () => {
        await generateImageService({ prompt: longPrompt });
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.ok(err.message.includes('exceeds maximum allowed limit'));
        return true;
      }
    );
  });

  it('should list 13 supported languages for translation', () => {
    assert.strictEqual(SUPPORTED_LANGUAGES.length, 13);
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    assert.ok(codes.includes('en'));
    assert.ok(codes.includes('es'));
    assert.ok(codes.includes('zh'));
    assert.ok(codes.includes('hi'));
    assert.ok(codes.includes('ja'));
  });

  it('should reject invalid URL in summarizeFromUrlService', async () => {
    await assert.rejects(
      async () => {
        await summarizeFromUrlService('not-a-valid-url');
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.ok(err.message.includes('URL validation failed') || err.message.includes('valid'));
        return true;
      }
    );
  });

  it('should reject short text in summarizeFromTextService', async () => {
    await assert.rejects(
      async () => {
        await summarizeFromTextService('too short');
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.ok(err.message.includes('at least 20 characters'));
        return true;
      }
    );
  });

  it('should reject unsupported language code in translateTextService', async () => {
    await assert.rejects(
      async () => {
        await translateTextService('Hello world', 'invalid_code');
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.ok(err.message.includes('not supported'));
        return true;
      }
    );
  });
});

describe('Post Service Validation Tests', () => {
  it('should reject post creation without name', async () => {
    await assert.rejects(
      async () => {
        await createPostService({ name: '', prompt: 'sample', model: 'sd', file: {} });
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.ok(err.message.includes('Creator name is required'));
        return true;
      }
    );
  });

  it('should reject post creation without prompt', async () => {
    await assert.rejects(
      async () => {
        await createPostService({ name: 'Alice', prompt: '', model: 'sd', file: {} });
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.ok(err.message.includes('Prompt is required'));
        return true;
      }
    );
  });

  it('should reject post creation without image file', async () => {
    await assert.rejects(
      async () => {
        await createPostService({ name: 'Alice', prompt: 'sample prompt', model: 'sd', file: null });
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.ok(err.message.includes('Image file (photoFile) is required'));
        return true;
      }
    );
  });

  it('should reject invalid MIME type in file upload', async () => {
    const invalidFile = {
      mimetype: 'application/pdf',
      size: 1024,
    };
    await assert.rejects(
      async () => {
        await createPostService({ name: 'Alice', prompt: 'sample', model: 'sd', file: invalidFile });
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.ok(err.message.includes('Invalid file format'));
        return true;
      }
    );
  });

  it('should reject oversized file in file upload', async () => {
    const oversizedFile = {
      mimetype: 'image/jpeg',
      size: 15 * 1024 * 1024, // 15MB
    };
    await assert.rejects(
      async () => {
        await createPostService({ name: 'Alice', prompt: 'sample', model: 'sd', file: oversizedFile });
      },
      (err) => {
        assert.strictEqual(err.status, 400);
        assert.ok(err.message.includes('10MB limit'));
        return true;
      }
    );
  });

  it('should return safe empty array when DB is disconnected in getPostsService', async () => {
    const result = await getPostsService({ page: 1, limit: 10 });
    assert.ok(Array.isArray(result.posts));
    assert.strictEqual(typeof result.pagination.total, 'number');
  });
});
