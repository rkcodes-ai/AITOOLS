import { ValidationError } from '../utils/errors.js';
import { SUPPORTED_IMAGE_MODELS } from '../services/ai/imageService.js';
import { SUPPORTED_LANGUAGES } from '../services/ai/textService.js';

const VALID_ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4'];
const VALID_QUALITY_PRESETS = ['fast', 'balanced', 'quality'];

export const validateImageGenerationInput = ({
  prompt,
  model,
  negativePrompt,
  aspectRatio = '1:1',
  guidanceScale,
  steps,
  seed,
  quality,
}) => {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new ValidationError('Prompt is required and cannot be empty.', 'EMPTY_PROMPT');
  }

  if (prompt.trim().length > 1000) {
    throw new ValidationError('Prompt length exceeds maximum allowed limit of 1000 characters.', 'PROMPT_TOO_LONG');
  }

  const selectedModel = model && SUPPORTED_IMAGE_MODELS.includes(model)
    ? model
    : 'stabilityai/stable-diffusion-2-1';

  let sanitizedNegativePrompt = null;
  if (negativePrompt && typeof negativePrompt === 'string') {
    if (negativePrompt.trim().length > 500) {
      throw new ValidationError('Negative prompt cannot exceed 500 characters.', 'NEGATIVE_PROMPT_TOO_LONG');
    }
    sanitizedNegativePrompt = negativePrompt.trim();
  }

  const sanitizedAspectRatio = VALID_ASPECT_RATIOS.includes(aspectRatio) ? aspectRatio : '1:1';

  let sanitizedSeed = null;
  if (seed !== undefined && seed !== null && seed !== '') {
    const parsedSeed = parseInt(seed, 10);
    if (isNaN(parsedSeed) || parsedSeed < 0 || parsedSeed > 2147483647) {
      throw new ValidationError('Seed must be a positive integer between 0 and 2,147,483,647.', 'INVALID_SEED');
    }
    sanitizedSeed = parsedSeed;
  }

  let sanitizedSteps = null;
  if (steps !== undefined && steps !== null && steps !== '') {
    const parsedSteps = parseInt(steps, 10);
    if (isNaN(parsedSteps) || parsedSteps < 1 || parsedSteps > 50) {
      throw new ValidationError('Inference steps must be an integer between 1 and 50.', 'INVALID_STEPS');
    }
    sanitizedSteps = parsedSteps;
  }

  let sanitizedGuidanceScale = null;
  if (guidanceScale !== undefined && guidanceScale !== null && guidanceScale !== '') {
    const parsedGuidance = parseFloat(guidanceScale);
    if (isNaN(parsedGuidance) || parsedGuidance < 1.0 || parsedGuidance > 20.0) {
      throw new ValidationError('Guidance scale must be a number between 1.0 and 20.0.', 'INVALID_GUIDANCE_SCALE');
    }
    sanitizedGuidanceScale = parsedGuidance;
  }

  const sanitizedQuality = VALID_QUALITY_PRESETS.includes(quality) ? quality : null;

  return {
    prompt: prompt.trim(),
    model: selectedModel,
    negativePrompt: sanitizedNegativePrompt,
    aspectRatio: sanitizedAspectRatio,
    seed: sanitizedSeed,
    steps: sanitizedSteps,
    guidanceScale: sanitizedGuidanceScale,
    quality: sanitizedQuality,
  };
};

export const validateSummarizeInput = ({ url, text, length, percentage, lang, action }) => {
  if (!url && !text) {
    throw new ValidationError('Either an article URL or text body must be provided for summarization.', 'INVALID_INPUT');
  }

  if (text && (typeof text !== 'string' || text.trim().length < 20)) {
    throw new ValidationError('Text input must contain at least 20 characters.', 'TEXT_TOO_SHORT');
  }

  if (text && text.length > 50000) {
    throw new ValidationError('Text input exceeds maximum limit of 50,000 characters.', 'TEXT_TOO_LONG');
  }

  if (lang && !SUPPORTED_LANGUAGES.some((l) => l.code === lang)) {
    throw new ValidationError(`Target language code '${lang}' is not supported.`, 'UNSUPPORTED_LANGUAGE');
  }

  const VALID_ACTIONS = ['Summarize', 'Rewrite', 'Explain', 'Improve', 'Analyze'];
  const sanitizedAction = VALID_ACTIONS.includes(action) ? action : 'Summarize';

  return {
    url: url ? url.trim() : null,
    text: text ? text.trim() : null,
    length: length ? parseInt(length, 10) : 3,
    percentage: percentage ? parseInt(percentage, 10) : 40,
    lang: lang || null,
    action: sanitizedAction,
  };
};

export const validateTranslateInput = ({ text, targetLang, targetLanguage, sourceLang = 'en' }) => {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new ValidationError('Text to translate cannot be empty.', 'EMPTY_TEXT');
  }

  if (text.length > 20000) {
    throw new ValidationError('Text to translate exceeds maximum limit of 20,000 characters.', 'TEXT_TOO_LONG');
  }

  const resolvedTarget = targetLang || targetLanguage;
  const isValidLang = SUPPORTED_LANGUAGES.some((l) => l.code === resolvedTarget);
  if (!isValidLang) {
    throw new ValidationError(`Target language code '${resolvedTarget}' is not supported.`, 'UNSUPPORTED_LANGUAGE');
  }

  return {
    text: text.trim(),
    targetLang: resolvedTarget,
    sourceLang: sourceLang || 'en',
  };
};
