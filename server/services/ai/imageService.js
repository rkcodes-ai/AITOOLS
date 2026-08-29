import { modelRegistry } from '../../providers/registry/modelRegistry.js';
import { providerRegistry } from '../../providers/registry/providerRegistry.js';
import { ProviderError } from '../../providers/errors/providerErrors.js';
import { ValidationError } from '../../utils/errors.js';
import { config } from '../../config/env.js';

export const SUPPORTED_IMAGE_MODELS = modelRegistry.listImageModels(false);

/**
 * Orchestrate image generation across registered providers, capability translation, and model fallbacks
 */
export const generateImageService = async ({
  prompt,
  model,
  negativePrompt = null,
  aspectRatio = '1:1',
  guidanceScale = null,
  steps = null,
  seed = null,
  quality = null,
}) => {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new ValidationError('Prompt is required and cannot be empty.');
  }

  if (prompt.trim().length > config.limits.maxPromptLength) {
    throw new ValidationError(
      `Prompt length exceeds maximum allowed limit of ${config.limits.maxPromptLength} characters.`
    );
  }

  // 1. Resolve requested model or default
  const defaultModelMeta = modelRegistry.getDefaultImageModel();
  const selectedModelId = model && modelRegistry.isImageModelSupported(model)
    ? model
    : defaultModelMeta.id;

  const modelMeta = modelRegistry.getImageModel(selectedModelId);
  const primaryProvider = providerRegistry.getImageProvider(modelMeta.provider);

  // 2. Derive dimensions from model aspect ratio capabilities
  const modelDims = modelMeta.capabilities?.dimensions?.[aspectRatio] ||
    modelMeta.capabilities?.dimensions?.['1:1'] || { width: 512, height: 512 };

  // 3. Derive quality preset settings if provided and not explicitly overridden
  let resolvedSteps = steps;
  let resolvedGuidance = guidanceScale;

  if (quality && modelMeta.capabilities?.qualityPresets?.[quality]) {
    const preset = modelMeta.capabilities.qualityPresets[quality];
    if (resolvedSteps === null) resolvedSteps = preset.steps;
    if (resolvedGuidance === null) resolvedGuidance = preset.guidanceScale;
  }

  // Apply model-safe defaults if still null
  if (resolvedSteps === null && modelMeta.capabilities?.steps?.default) {
    resolvedSteps = modelMeta.capabilities.steps.default;
  }
  if (resolvedGuidance === null && modelMeta.capabilities?.guidanceScale?.default) {
    resolvedGuidance = modelMeta.capabilities.guidanceScale.default;
  }

  const options = {
    negativePrompt: modelMeta.capabilities?.negativePrompt ? negativePrompt : null,
    aspectRatio,
    width: modelDims.width,
    height: modelDims.height,
    steps: resolvedSteps,
    guidanceScale: modelMeta.capabilities?.guidanceScale?.supported ? resolvedGuidance : null,
    seed,
    quality,
  };

  console.log(
    `[ImageService] Orchestrating image generation with model: ${modelMeta.id} (aspectRatio: ${aspectRatio}, dims: ${modelDims.width}x${modelDims.height})`
  );

  let primaryResult;
  try {
    primaryResult = await primaryProvider.generateImage({
      prompt: prompt.trim(),
      model: modelMeta.id,
      options,
    });

    return {
      imageUrl: primaryResult.imageUrl,
      model: modelMeta.id,
      provider: modelMeta.provider,
      prompt: prompt.trim(),
      options,
      usedFallback: false,
    };
  } catch (primaryError) {
    console.warn(`[ImageService] Primary model ${modelMeta.id} failed: ${primaryError.message}`);

    // Check if fallback is viable
    const fallbackModelMeta = modelRegistry.getFallbackImageModel();
    if (fallbackModelMeta && fallbackModelMeta.id !== modelMeta.id && primaryError.retryable !== false) {
      console.log(
        `[ImageService] Attempting fallback model: ${fallbackModelMeta.id} (provider: ${fallbackModelMeta.provider})`
      );

      try {
        const fallbackProvider = providerRegistry.getImageProvider(fallbackModelMeta.provider);
        const fallbackDims = fallbackModelMeta.capabilities?.dimensions?.[aspectRatio] || { width: 1024, height: 1024 };

        const fallbackOptions = {
          ...options,
          width: fallbackDims.width,
          height: fallbackDims.height,
          negativePrompt: null, // Fallback FLUX doesn't use negative prompts
        };

        const fallbackResult = await fallbackProvider.generateImage({
          prompt: prompt.trim(),
          model: fallbackModelMeta.id,
          options: fallbackOptions,
        });

        return {
          imageUrl: fallbackResult.imageUrl,
          model: fallbackModelMeta.id,
          provider: fallbackModelMeta.provider,
          prompt: prompt.trim(),
          options: fallbackOptions,
          usedFallback: true,
        };
      } catch (fallbackError) {
        console.error(`[ImageService] Fallback model ${fallbackModelMeta.id} also failed: ${fallbackError.message}`);
      }
    }

    if (primaryError instanceof ProviderError) throw primaryError;
    throw new ProviderError(
      primaryError.message || 'Failed to generate image from AI provider.',
      primaryError.status || 502,
      primaryError.retryable || false,
      'PROVIDER_ERROR',
      modelMeta.provider
    );
  }
};
