import { generateImageService } from '../services/ai/imageService.js';
import {
  summarizeFromUrlService,
  summarizeFromTextService,
  translateTextService,
} from '../services/ai/textService.js';
import { recordGeneration } from '../services/ai/generationHistoryService.js';
import {
  validateImageGenerationInput,
  validateSummarizeInput,
  validateTranslateInput,
} from '../validators/aiValidators.js';
import { modelRegistry } from '../providers/registry/modelRegistry.js';
import { providerRegistry } from '../providers/registry/providerRegistry.js';

export const generateImage = async (req, res, next) => {
  let validated = null;
  try {
    validated = validateImageGenerationInput(req.body);
    const result = await generateImageService(validated);

    // Record user generation history if authenticated
    if (req.user?.id) {
      await recordGeneration({
        userId: req.user.id,
        type: 'image',
        provider: result.provider || 'huggingface',
        model: result.model,
        prompt: result.prompt,
        result: { imageUrl: result.imageUrl },
        metadata: {
          aspectRatio: result.options?.aspectRatio,
          width: result.options?.width,
          height: result.options?.height,
          seed: result.options?.seed,
          steps: result.options?.steps,
          guidanceScale: result.options?.guidanceScale,
          negativePrompt: result.options?.negativePrompt,
          quality: result.options?.quality,
        },
        status: 'completed',
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (req.user?.id && validated) {
      await recordGeneration({
        userId: req.user.id,
        type: 'image',
        provider: 'huggingface',
        model: validated.model || '',
        prompt: validated.prompt || '',
        metadata: {
          aspectRatio: validated.aspectRatio,
          negativePrompt: validated.negativePrompt,
          seed: validated.seed,
          steps: validated.steps,
          guidanceScale: validated.guidanceScale,
        },
        status: 'failed',
        errorCode: error.code || 'PROVIDER_ERROR',
      });
    }
    next(error);
  }
};

export const summarize = async (req, res, next) => {
  let validated = null;
  try {
    validated = validateSummarizeInput(req.body);

    if (validated.url) {
      const result = await summarizeFromUrlService(validated.url, validated.length, validated.lang);

      if (req.user?.id) {
        await recordGeneration({
          userId: req.user.id,
          type: 'summarize_url',
          provider: result.provider || 'rapidapi',
          prompt: validated.url,
          input: validated.url,
          result: { summary: result.summary, url: result.url },
          status: 'completed',
        });
      }

      return res.status(200).json({
        success: true,
        data: result,
      });
    }

    if (validated.text) {
      const result = await summarizeFromTextService(validated.text, validated.percentage, validated.action);

      if (req.user?.id) {
        await recordGeneration({
          userId: req.user.id,
          type: 'summarize_text',
          provider: result.provider || 'rapidapi',
          prompt: validated.text.slice(0, 200),
          input: validated.text,
          result: { summary: result.summary, action: validated.action },
          status: 'completed',
        });
      }

      return res.status(200).json({
        success: true,
        data: result,
      });
    }
  } catch (error) {
    if (req.user?.id && validated) {
      await recordGeneration({
        userId: req.user.id,
        type: validated.url ? 'summarize_url' : 'summarize_text',
        provider: 'rapidapi',
        prompt: validated.url || (validated.text ? validated.text.slice(0, 200) : ''),
        status: 'failed',
        errorCode: error.code || 'PROVIDER_ERROR',
      });
    }
    next(error);
  }
};

export const translate = async (req, res, next) => {
  let validated = null;
  try {
    validated = validateTranslateInput(req.body);
    const result = await translateTextService(validated.text, validated.targetLang, validated.sourceLang);

    if (req.user?.id) {
      await recordGeneration({
        userId: req.user.id,
        type: 'translate',
        provider: result.provider || 'rapidapi',
        prompt: validated.text.slice(0, 200),
        input: validated.text,
        result: {
          translatedText: result.translatedText,
          targetLang: result.targetLang,
          sourceLang: result.sourceLang,
        },
        status: 'completed',
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (req.user?.id && validated) {
      await recordGeneration({
        userId: req.user.id,
        type: 'translate',
        provider: 'rapidapi',
        prompt: validated.text ? validated.text.slice(0, 200) : '',
        status: 'failed',
        errorCode: error.code || 'PROVIDER_ERROR',
      });
    }
    next(error);
  }
};

export const getAIConfig = async (req, res, next) => {
  try {
    const imageModels = modelRegistry.listImageModels(true);
    const languages = modelRegistry.getLanguages();
    const providersHealth = await providerRegistry.getHealth();

    return res.status(200).json({
      success: true,
      data: {
        imageModels,
        languages,
        providers: providersHealth,
      },
    });
  } catch (error) {
    next(error);
  }
};
