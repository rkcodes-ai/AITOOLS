import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateSearchQueryInput,
  validateCollectionCreateInput,
  validateCollectionUpdateInput,
  sanitizeCollectionListParams,
} from '../../../validators/knowledgeValidators.js';

describe('Knowledge Validators Unit Tests', () => {
  it('should accept valid search query input', () => {
    const valid = validateSearchQueryInput({
      query: 'deep learning architectures',
      topK: 10,
      minSimilarity: 0.25,
      semanticWeight: 0.65,
    });

    assert.strictEqual(valid.query, 'deep learning architectures');
    assert.strictEqual(valid.topK, 10);
    assert.strictEqual(valid.minSimilarity, 0.25);
    assert.strictEqual(valid.semanticWeight, 0.65);
  });

  it('should reject empty or invalid search query', () => {
    assert.throws(() => validateSearchQueryInput({ query: '' }));
    assert.throws(() => validateSearchQueryInput({ query: '   ' }));
    assert.throws(() => validateSearchQueryInput({ query: 123 }));
  });

  it('should reject out-of-range topK and minSimilarity', () => {
    assert.throws(() => validateSearchQueryInput({ query: 'test', topK: 99 }));
    assert.throws(() => validateSearchQueryInput({ query: 'test', topK: -1 }));
    assert.throws(() => validateSearchQueryInput({ query: 'test', minSimilarity: 1.5 }));
  });

  it('should validate collection creation input', () => {
    const res = validateCollectionCreateInput({
      name: 'College Notes',
      description: 'DBMS and OS notes',
      documentIds: ['doc_1', 'doc_2'],
    });

    assert.strictEqual(res.name, 'College Notes');
    assert.strictEqual(res.description, 'DBMS and OS notes');
    assert.strictEqual(res.documentIds.length, 2);
  });

  it('should reject collection creation without name or excessive length', () => {
    assert.throws(() => validateCollectionCreateInput({ name: '' }));
    assert.throws(() => validateCollectionCreateInput({ name: 'x'.repeat(101) }));
    assert.throws(() => validateCollectionCreateInput({ name: 'Valid', description: 'y'.repeat(501) }));
  });

  it('should validate collection update input with status enum', () => {
    const res = validateCollectionUpdateInput({
      name: 'Renamed',
      status: 'archived',
    });

    assert.strictEqual(res.name, 'Renamed');
    assert.strictEqual(res.status, 'archived');

    assert.throws(() => validateCollectionUpdateInput({ status: 'invalid_status' }));
  });

  it('should sanitize pagination and search parameters for collections', () => {
    const params = sanitizeCollectionListParams({
      page: '3',
      limit: '15',
      search: '  databases  ',
      status: 'archived',
    });

    assert.strictEqual(params.page, 3);
    assert.strictEqual(params.limit, 15);
    assert.strictEqual(params.search, 'databases');
    assert.strictEqual(params.status, 'archived');
  });
});
