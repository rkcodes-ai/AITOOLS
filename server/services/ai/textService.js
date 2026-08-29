import { providerRegistry } from '../../providers/registry/providerRegistry.js';
import { modelRegistry } from '../../providers/registry/modelRegistry.js';
import { validateUrlForSSRF } from '../../utils/urlValidator.js';
import { SSRFError, ValidationError } from '../../utils/errors.js';
import { config } from '../../config/env.js';

export const SUPPORTED_LANGUAGES = modelRegistry.getLanguages();

/**
 * Summarize an online article via URL with SSRF protection and provider abstraction
 */
export const summarizeFromUrlService = async (urlInput, length = 3, lang = null) => {
  const validation = await validateUrlForSSRF(urlInput);
  if (!validation.isValid) {
    throw new SSRFError(validation.reason);
  }

  const sanitizedUrl = validation.sanitizedUrl;
  const textProvider = providerRegistry.getTextProvider('rapidapi');

  const result = await textProvider.summarizeUrl({
    url: sanitizedUrl,
    length,
    lang,
  });

  return {
    summary: result.summary,
    url: sanitizedUrl,
    provider: result.provider,
  };
};

/**
 * Summarize raw paragraph text with provider abstraction
 */
export const summarizeFromTextService = async (text, percentage = 40, action = 'Summarize') => {
  if (!text || typeof text !== 'string' || text.trim().length < 20) {
    throw new ValidationError('Text input must contain at least 20 characters.');
  }

  if (text.length > config.limits.maxTextSummarizeLength) {
    throw new ValidationError(`Text input exceeds maximum limit of ${config.limits.maxTextSummarizeLength} characters.`);
  }

  const validPercentage = Math.min(100, Math.max(10, parseInt(percentage, 10) || 40));
  const textProvider = providerRegistry.getTextProvider('rapidapi');

  const result = await textProvider.summarizeText({
    text: text.trim(),
    percentage: validPercentage,
    action,
  });

  return {
    summary: result.summary,
    action: result.action || action,
    provider: result.provider,
  };
};

/**
 * Translate text to target language with provider abstraction
 */
export const translateTextService = async (text, targetLang, sourceLang = 'en') => {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new ValidationError('Text to translate cannot be empty.');
  }

  if (text.length > config.limits.maxTranslateLength) {
    throw new ValidationError(`Text to translate exceeds maximum limit of ${config.limits.maxTranslateLength} characters.`);
  }

  const isValidLang = SUPPORTED_LANGUAGES.some((l) => l.code === targetLang);
  if (!isValidLang) {
    throw new ValidationError(`Target language code '${targetLang}' is not supported.`);
  }

  const translationProvider = providerRegistry.getTranslationProvider('rapidapi');

  const result = await translationProvider.translateText({
    text: text.trim(),
    targetLang,
    sourceLang,
  });

  return {
    translatedText: result.translatedText,
    targetLang: result.targetLang,
    sourceLang: result.sourceLang,
    provider: result.provider,
  };
};
