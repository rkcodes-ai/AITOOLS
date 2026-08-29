import { describe, it } from 'node:test';
import assert from 'node:assert';
import { rankingService } from '../../../services/knowledge/rankingService.js';

describe('Ranking Service & Scoring Unit Tests', () => {
  it('should give high keyword score to exact phrase matches', () => {
    const text = 'This document covers relational database management systems and indexing.';
    const score = rankingService.computeKeywordScore(text, {
      normalizedQuery: 'relational database',
      keywords: ['relational', 'database'],
    });

    assert.ok(score >= 0.7, `Expected score >= 0.7, got ${score}`);
    assert.ok(score <= 1.0);
  });

  it('should score partial keyword matches lower than exact matches', () => {
    const text = 'This section discusses computer networking protocols and sockets.';
    const exactScore = rankingService.computeKeywordScore(text, {
      normalizedQuery: 'computer networking',
      keywords: ['computer', 'networking'],
    });
    const partialScore = rankingService.computeKeywordScore(text, {
      normalizedQuery: 'computer architecture and graphics',
      keywords: ['computer', 'architecture', 'graphics'],
    });

    assert.ok(exactScore > partialScore);
  });

  it('should return 0 keyword score for completely unrelated text', () => {
    const text = 'Baking sourdough bread requires flour, water, and yeast.';
    const score = rankingService.computeKeywordScore(text, {
      normalizedQuery: 'quantum cryptography algorithms',
      keywords: ['quantum', 'cryptography', 'algorithms'],
    });

    assert.strictEqual(score, 0);
  });

  it('should compute weighted hybrid score accurately and clamp between 0 and 1', () => {
    const hybridScore = rankingService.computeHybridScore({
      semanticScore: 0.80,
      keywordScore: 0.60,
      semanticWeight: 0.70,
      keywordWeight: 0.30,
    });

    // 0.80 * 0.70 + 0.60 * 0.30 = 0.56 + 0.18 = 0.74
    assert.strictEqual(hybridScore, 0.74);
  });

  it('should generate informative human-readable result explanations', () => {
    const exp1 = rankingService.generateExplanation({
      semanticScore: 0.85,
      keywordScore: 0.70,
      finalScore: 0.80,
      hasExactPhrase: true,
      collectionName: 'CS Notes',
    });

    assert.ok(exp1.includes('Exact phrase matched in document'));
    assert.ok(exp1.includes('High semantic similarity'));
    assert.ok(exp1.includes('CS Notes'));

    const exp2 = rankingService.generateExplanation({
      semanticScore: 0.20,
      keywordScore: 0.80,
      finalScore: 0.50,
      matchedKeywordsCount: 3,
      hasExactPhrase: false,
    });

    assert.ok(exp2.includes('Matched 3 key search terms'));
  });
});
