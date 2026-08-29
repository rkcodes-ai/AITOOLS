import { describe, it } from 'node:test';
import assert from 'node:assert';
import { queryProcessor } from '../../../services/knowledge/queryProcessor.js';

describe('Query Processor & Normalization Unit Tests', () => {
  it('should normalize multiple whitespaces and trim edges', () => {
    const res = queryProcessor.process('   distributed   systems   architecture   ');
    assert.strictEqual(res.normalizedQuery, 'distributed systems architecture');
  });

  it('should extract meaningful keywords and filter common stop words', () => {
    const res = queryProcessor.process('what is the architecture of the neural network');
    assert.ok(res.keywords.includes('architecture'));
    assert.ok(res.keywords.includes('neural'));
    assert.ok(res.keywords.includes('network'));
    assert.strictEqual(res.keywords.includes('the'), false);
    assert.strictEqual(res.keywords.includes('is'), false);
  });

  it('should reject empty or whitespace-only search queries', () => {
    assert.throws(
      () => queryProcessor.process('   '),
      (err) => {
        assert.strictEqual(err.code, 'EMPTY_SEARCH_QUERY');
        return true;
      }
    );
  });

  it('should reject query shorter than minimum length', () => {
    assert.throws(
      () => queryProcessor.process('a', { minLength: 2 }),
      (err) => {
        assert.strictEqual(err.code, 'QUERY_TOO_SHORT');
        return true;
      }
    );
  });

  it('should reject query exceeding maximum character length', () => {
    const longQuery = 'x'.repeat(1001);
    assert.throws(
      () => queryProcessor.process(longQuery, { maxLength: 1000 }),
      (err) => {
        assert.strictEqual(err.code, 'QUERY_TOO_LONG');
        return true;
      }
    );
  });

  it('should generate safe regex patterns escaping special characters', () => {
    const res = queryProcessor.process('c++ and (regex) test');
    assert.ok(Array.isArray(res.safeRegexTerms));
    assert.ok(res.safeRegexTerms.length > 0);
    // Ensure regex does not crash with parentheses
    assert.doesNotThrow(() => {
      res.safeRegexTerms.forEach((rx) => rx.test('c++ in (regex)'));
    });
  });
});
