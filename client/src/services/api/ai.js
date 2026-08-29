import { apiClient } from './client';

/**
 * Generate an image through the backend AI proxy with advanced studio parameters
 */
export const generateImageApi = async ({
  prompt,
  model,
  negativePrompt,
  aspectRatio,
  guidanceScale,
  steps,
  seed,
  quality,
}) => {
  return apiClient.post('/ai/image', {
    prompt,
    model,
    negativePrompt,
    aspectRatio,
    guidanceScale,
    steps,
    seed,
    quality,
  });
};

/**
 * Summarize or transform text / article URL through backend AI proxy
 */
export const summarizeApi = async ({ url, text, length = 3, percentage = 40, lang = null, action = 'Summarize' }) => {
  return apiClient.post('/ai/summarize', {
    url,
    text,
    length,
    percentage,
    lang,
    action,
  });
};

/**
 * Translate text to target language code
 */
export const translateApi = async ({ text, targetLang, targetLanguage, sourceLang = 'en' }) => {
  return apiClient.post('/ai/translate', {
    text,
    targetLang: targetLang || targetLanguage,
    sourceLang,
  });
};

/**
 * Retrieve supported AI models and capabilities
 */
export const getAIConfigApi = async () => {
  return apiClient.get('/ai/config');
};
