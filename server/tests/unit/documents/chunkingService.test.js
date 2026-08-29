import { describe, it } from 'node:test';
import assert from 'node:assert';
import { chunkingService } from '../../../services/documents/chunkingService.js';

describe('Document Chunking Service Unit Tests', () => {
  it('should chunk multi-page document and preserve page references', () => {
    const pages = [
      { pageNumber: 1, text: 'Page 1 introductory text explaining the project architecture.' },
      { pageNumber: 2, text: 'Page 2 detailing security principles, RBAC, and IDOR protection in depth.' },
    ];

    const chunks = chunkingService.chunkDocument({
      pages,
      documentId: 'doc_123',
      userId: 'user_456',
      targetChunkSize: 500,
    });

    assert.strictEqual(chunks.length, 2);
    assert.strictEqual(chunks[0].chunkIndex, 0);
    assert.strictEqual(chunks[0].pageStart, 1);
    assert.strictEqual(chunks[0].documentId, 'doc_123');
    assert.strictEqual(chunks[0].userId, 'user_456');
    assert.strictEqual(chunks[1].chunkIndex, 1);
    assert.strictEqual(chunks[1].pageStart, 2);
    assert.ok(chunks[0].tokenEstimate > 0);
  });

  it('should split long single-page text into multiple overlapping chunks', () => {
    const longText = 'A'.repeat(1200);
    const pages = [{ pageNumber: 1, text: longText }];

    const chunks = chunkingService.chunkDocument({
      pages,
      documentId: 'doc_123',
      userId: 'user_456',
      targetChunkSize: 400,
      overlap: 50,
    });

    assert.ok(chunks.length >= 3);
    chunks.forEach((c) => {
      assert.strictEqual(c.pageStart, 1);
      assert.strictEqual(c.documentId, 'doc_123');
      assert.ok(c.text.length <= 450);
    });
  });
});
