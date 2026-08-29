import { ValidationError } from '../../utils/errors.js';
import { escapeRegex } from '../../utils/sanitize.js';

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'were', 'will', 'with', 'the', 'this', 'how', 'what',
  'when', 'where', 'who', 'why', 'can', 'should', 'could', 'does', 'do'
]);

export const queryProcessor = {
  /**
   * Normalize, sanitize, and validate incoming user search query
   */
  process(rawQuery, { minLength = 2, maxLength = 1000 } = {}) {
    if (typeof rawQuery !== 'string') {
      throw new ValidationError('Search query must be a string.', 'INVALID_QUERY_TYPE');
    }

    // 1. Normalize whitespace and trim
    const normalized = rawQuery.replace(/\s+/g, ' ').trim();

    if (normalized.length === 0) {
      throw new ValidationError('Search query cannot be empty.', 'EMPTY_SEARCH_QUERY');
    }

    if (normalized.length < minLength) {
      throw new ValidationError(
        `Search query must be at least ${minLength} characters long.`,
        'QUERY_TOO_SHORT'
      );
    }

    if (normalized.length > maxLength) {
      throw new ValidationError(
        `Search query cannot exceed ${maxLength} characters.`,
        'QUERY_TOO_LONG'
      );
    }

    // 2. Extract significant search keywords / tokens (excluding common stop words)
    const rawTokens = normalized
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .split(/\s+/)
      .filter(Boolean);

    const keywords = rawTokens.filter((t) => !STOP_WORDS.has(t) && t.length >= 2);
    // If all words were stop words (e.g. "what is it"), fallback to all raw tokens
    const finalKeywords = keywords.length > 0 ? keywords : rawTokens;

    // 3. Generate safe regex patterns for exact term search
    const safeRegexTerms = finalKeywords.map((kw) => new RegExp(escapeRegex(kw), 'i'));

    return {
      rawQuery,
      normalizedQuery: normalized,
      keywords: finalKeywords,
      safeRegexTerms,
      tokenCount: rawTokens.length,
    };
  },
};
