// Helper for fuzzy match and stemming tolerance
function termMatches(term, text) {
  if (!term || !text) return false;
  const cleanTerm = term.toLowerCase();
  const cleanText = text.toLowerCase();

  // 1. Direct substring match
  if (cleanText.includes(cleanTerm)) return true;

  // 2. Stemming prefix match (e.g. "requiement" / "requirement" / "requirements", "analysys" / "analysis")
  if (cleanTerm.length >= 4) {
    const stem = cleanTerm.slice(0, Math.min(cleanTerm.length - 1, 5));
    if (cleanText.includes(stem)) return true;
  }

  // 3. Word-level fuzzy similarity (1 edit difference tolerance for typos)
  const words = cleanText.replace(/[^\w\s]/g, ' ').split(/\s+/);
  for (const w of words) {
    if (w.length >= 4 && cleanTerm.length >= 4) {
      if (w.startsWith(cleanTerm) || cleanTerm.startsWith(w)) return true;
      if (Math.abs(w.length - cleanTerm.length) <= 2 && w.length >= 5) {
        let diffs = 0;
        let i = 0, j = 0;
        while (i < w.length && j < cleanTerm.length) {
          if (w[i] !== cleanTerm[j]) {
            diffs++;
            if (diffs > 1) break;
            if (w.length > cleanTerm.length) i++;
            else if (cleanTerm.length > w.length) j++;
            else { i++; j++; }
          } else {
            i++; j++;
          }
        }
        if (diffs <= 1) return true;
      }
    }
  }

  return false;
}

export const rankingService = {
  /**
   * Compute keyword relevance score for a chunk against query terms
   */
  computeKeywordScore(chunkText, { normalizedQuery, keywords = [] }) {
    if (!chunkText || typeof chunkText !== 'string') return 0;
    const lowerText = chunkText.toLowerCase();
    const lowerQuery = (normalizedQuery || '').toLowerCase();

    let score = 0;

    // 1. Exact full query phrase match
    if (lowerQuery && lowerText.includes(lowerQuery)) {
      score += 0.35;
    }

    // 2. Individual keyword matching ratio with stemming and typo tolerance
    if (keywords.length > 0) {
      let matchedCount = 0;
      let totalOccurrences = 0;

      for (const kw of keywords) {
        if (termMatches(kw, lowerText)) {
          matchedCount++;
          // Count occurrences (capped at 4 for density bonus)
          const matches = lowerText.split(kw).length - 1;
          totalOccurrences += Math.max(1, Math.min(matches, 4));
        }
      }

      const matchRatio = matchedCount / keywords.length;
      score += matchRatio * 0.50;

      // Frequency density bonus (up to 0.15)
      const densityBonus = Math.min(totalOccurrences * 0.03, 0.15);
      score += densityBonus;
    }

    return Math.min(parseFloat(score.toFixed(4)), 1.0);
  },

  /**
   * Calculate final hybrid score with configurable weights
   */
  computeHybridScore({
    semanticScore = 0,
    keywordScore = 0,
    semanticWeight = 0.70,
    keywordWeight = 0.30,
  }) {
    const sem = Math.max(0, Math.min(1, semanticScore));
    const kw = Math.max(0, Math.min(1, keywordScore));

    const totalWeight = semanticWeight + keywordWeight;
    const normSemWeight = totalWeight > 0 ? semanticWeight / totalWeight : 0.70;
    const normKwWeight = totalWeight > 0 ? keywordWeight / totalWeight : 0.30;

    const finalScore = sem * normSemWeight + kw * normKwWeight;
    return Math.min(parseFloat(finalScore.toFixed(4)), 1.0);
  },

  /**
   * Generate human-readable explanation for why this result was retrieved and ranked
   */
  generateExplanation({
    semanticScore,
    keywordScore,
    finalScore,
    matchedKeywordsCount = 0,
    hasExactPhrase = false,
    collectionName = null,
  }) {
    const reasons = [];

    if (hasExactPhrase) {
      reasons.push('Exact phrase matched in document');
    } else if (matchedKeywordsCount > 0) {
      reasons.push(`Matched ${matchedKeywordsCount} key search term${matchedKeywordsCount > 1 ? 's' : ''}`);
    }

    if (semanticScore >= 0.75) {
      reasons.push('High semantic similarity');
    } else if (semanticScore >= 0.50) {
      reasons.push('Moderate conceptual relevance');
    }

    if (collectionName) {
      reasons.push(`Scoped from collection "${collectionName}"`);
    }

    if (reasons.length === 0) {
      if (finalScore >= 0.5) reasons.push('Relevant contextual match');
      else reasons.push('Partial text match');
    }

    return reasons.join(' • ');
  },
};
