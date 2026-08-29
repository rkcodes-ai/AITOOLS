import { describe, it } from 'node:test';
import assert from 'node:assert';
import { documentTextExtractor, ExtractionError } from '../../../services/documents/documentTextExtractor.js';

describe('Document Text Extractor Unit Tests', () => {
  it('should extract plain text document correctly', async () => {
    const textContent = 'This is a sample document content for AITOOLS RAG testing.\nIt contains multiple lines.';
    const buffer = Buffer.from(textContent, 'utf-8');

    const result = await documentTextExtractor.extract({
      buffer,
      mimeType: 'text/plain',
      originalFilename: 'notes.txt',
    });

    assert.strictEqual(result.pageCount, 1);
    assert.strictEqual(result.characterCount, textContent.length);
    assert.strictEqual(result.pages.length, 1);
    assert.strictEqual(result.pages[0].text, textContent);
  });

  it('should reject empty document buffer', async () => {
    await assert.rejects(
      async () => {
        await documentTextExtractor.extract({
          buffer: Buffer.from(''),
          mimeType: 'text/plain',
          originalFilename: 'empty.txt',
        });
      },
      (err) => {
        assert.ok(err instanceof ExtractionError);
        assert.strictEqual(err.code, 'EMPTY_DOCUMENT');
        return true;
      }
    );
  });

  it('should reject unsupported MIME type', async () => {
    await assert.rejects(
      async () => {
        await documentTextExtractor.extract({
          buffer: Buffer.from('dummy data'),
          mimeType: 'image/jpeg',
          originalFilename: 'photo.jpg',
        });
      },
      (err) => {
        assert.ok(err instanceof ExtractionError);
        assert.strictEqual(err.code, 'UNSUPPORTED_DOCUMENT_TYPE');
        return true;
      }
    );
  });
});
