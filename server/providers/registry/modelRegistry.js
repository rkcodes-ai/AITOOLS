import { ModelNotSupportedError } from '../errors/providerErrors.js';

export const IMAGE_MODELS = {
  'stabilityai/stable-diffusion-2-1': {
    id: 'stabilityai/stable-diffusion-2-1',
    name: 'Stable Diffusion 2.1',
    provider: 'huggingface',
    task: 'image-generation',
    enabled: true,
    isDefault: true,
    fallbackPriority: 1,
    maxPromptLength: 1000,
    description: 'High quality versatile text-to-image synthesis by Stability AI.',
    capabilities: {
      negativePrompt: true,
      seed: true,
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      guidanceScale: { supported: true, default: 7.5, min: 1.0, max: 20.0 },
      steps: { supported: true, default: 30, min: 10, max: 50 },
      dimensions: {
        '1:1': { width: 512, height: 512 },
        '16:9': { width: 768, height: 432 },
        '9:16': { width: 432, height: 768 },
        '4:3': { width: 640, height: 480 },
        '3:4': { width: 480, height: 640 },
      },
      qualityPresets: {
        fast: { steps: 20, guidanceScale: 6.0 },
        balanced: { steps: 30, guidanceScale: 7.5 },
        quality: { steps: 45, guidanceScale: 8.5 },
      },
    },
  },
  'black-forest-labs/FLUX.1-schnell': {
    id: 'black-forest-labs/FLUX.1-schnell',
    name: 'FLUX.1 Schnell',
    provider: 'huggingface',
    task: 'image-generation',
    enabled: true,
    isDefault: false,
    fallbackPriority: 2,
    maxPromptLength: 1000,
    description: 'Ultra-fast state-of-the-art 12B diffusion transformer model by Black Forest Labs.',
    capabilities: {
      negativePrompt: false,
      seed: true,
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      guidanceScale: { supported: false, default: 3.5, min: 1.0, max: 5.0 },
      steps: { supported: true, default: 4, min: 1, max: 8 },
      dimensions: {
        '1:1': { width: 1024, height: 1024 },
        '16:9': { width: 1024, height: 576 },
        '9:16': { width: 576, height: 1024 },
        '4:3': { width: 1024, height: 768 },
        '3:4': { width: 768, height: 1024 },
      },
      qualityPresets: {
        fast: { steps: 2, guidanceScale: 3.0 },
        balanced: { steps: 4, guidanceScale: 3.5 },
        quality: { steps: 8, guidanceScale: 4.0 },
      },
    },
  },
  'stabilityai/stable-diffusion-xl-base-1.0': {
    id: 'stabilityai/stable-diffusion-xl-base-1.0',
    name: 'SDXL Base 1.0',
    provider: 'huggingface',
    task: 'image-generation',
    enabled: true,
    isDefault: false,
    fallbackPriority: 3,
    maxPromptLength: 1000,
    description: 'Flagship 6.6B parameter SDXL model with rich details, native 1024x1024 resolution and lighting fidelity.',
    capabilities: {
      negativePrompt: true,
      seed: true,
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      guidanceScale: { supported: true, default: 7.5, min: 1.0, max: 20.0 },
      steps: { supported: true, default: 35, min: 10, max: 50 },
      dimensions: {
        '1:1': { width: 1024, height: 1024 },
        '16:9': { width: 1024, height: 576 },
        '9:16': { width: 576, height: 1024 },
        '4:3': { width: 1024, height: 768 },
        '3:4': { width: 768, height: 1024 },
      },
      qualityPresets: {
        fast: { steps: 25, guidanceScale: 6.5 },
        balanced: { steps: 35, guidanceScale: 7.5 },
        quality: { steps: 50, guidanceScale: 9.0 },
      },
    },
  },
  'runwayml/stable-diffusion-v1-5': {
    id: 'runwayml/stable-diffusion-v1-5',
    name: 'Stable Diffusion 1.5',
    provider: 'huggingface',
    task: 'image-generation',
    enabled: true,
    isDefault: false,
    fallbackPriority: 4,
    maxPromptLength: 1000,
    description: 'Classic lightweight diffusion generation model for fast iteration.',
    capabilities: {
      negativePrompt: true,
      seed: true,
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      guidanceScale: { supported: true, default: 7.5, min: 1.0, max: 20.0 },
      steps: { supported: true, default: 25, min: 10, max: 50 },
      dimensions: {
        '1:1': { width: 512, height: 512 },
        '16:9': { width: 512, height: 288 },
        '9:16': { width: 288, height: 512 },
        '4:3': { width: 512, height: 384 },
        '3:4': { width: 384, height: 512 },
      },
      qualityPresets: {
        fast: { steps: 15, guidanceScale: 6.0 },
        balanced: { steps: 25, guidanceScale: 7.5 },
        quality: { steps: 40, guidanceScale: 8.5 },
      },
    },
  },
};

export const EMBEDDING_MODELS = {
  'sentence-transformers/all-MiniLM-L6-v2': {
    id: 'sentence-transformers/all-MiniLM-L6-v2',
    name: 'All MiniLM L6 v2',
    provider: 'huggingface',
    task: 'feature-extraction',
    dimensions: 384,
    maxInputLength: 512,
    enabled: true,
    isDefault: true,
    description: 'Fast, compact 384-dimensional dense semantic text embedding model.',
  },
  'BAAI/bge-small-en-v1.5': {
    id: 'BAAI/bge-small-en-v1.5',
    name: 'BGE Small EN 1.5',
    provider: 'huggingface',
    task: 'feature-extraction',
    dimensions: 384,
    maxInputLength: 512,
    enabled: true,
    isDefault: false,
    description: 'State-of-the-art compact retrieval embedding model by BAAI.',
  },
};

export const CHAT_MODELS = {
  'meta-llama/Meta-Llama-3-8B-Instruct': {
    id: 'meta-llama/Meta-Llama-3-8B-Instruct',
    name: 'Llama 3 8B Instruct',
    provider: 'huggingface',
    task: 'text-generation',
    contextWindow: 8192,
    maxOutputTokens: 1024,
    enabled: true,
    isDefault: true,
    description: 'Meta flagship instruction-tuned LLM optimized for dialogue and RAG grounding.',
  },
  'mistralai/Mistral-7B-Instruct-v0.3': {
    id: 'mistralai/Mistral-7B-Instruct-v0.3',
    name: 'Mistral 7B Instruct v0.3',
    provider: 'huggingface',
    task: 'text-generation',
    contextWindow: 8192,
    maxOutputTokens: 1024,
    enabled: true,
    isDefault: false,
    description: 'High performance instruction model by Mistral AI with rigorous instruction following.',
  },
};

export const SUPPORTED_LANGUAGES = [
  { language: 'Chinese', code: 'zh' },
  { language: 'Spanish', code: 'es' },
  { language: 'English', code: 'en' },
  { language: 'Hindi', code: 'hi' },
  { language: 'Arabic', code: 'ar' },
  { language: 'Portuguese', code: 'pt' },
  { language: 'Russian', code: 'ru' },
  { language: 'Japanese', code: 'ja' },
  { language: 'Punjabi', code: 'pa' },
  { language: 'German', code: 'de' },
  { language: 'Italian', code: 'it' },
  { language: 'French', code: 'fr' },
  { language: 'Korean', code: 'ko' },
];

export const modelRegistry = {
  /**
   * Get metadata and capabilities for an image model
   */
  getImageModel(modelId) {
    const model = IMAGE_MODELS[modelId];
    if (!model || !model.enabled) {
      throw new ModelNotSupportedError(modelId);
    }
    return model;
  },

  isImageModelSupported(modelId) {
    return Boolean(IMAGE_MODELS[modelId] && IMAGE_MODELS[modelId].enabled);
  },

  listImageModels(fullMetadata = false) {
    const enabled = Object.values(IMAGE_MODELS).filter((m) => m.enabled);
    if (fullMetadata) return enabled;
    return enabled.map((m) => m.id);
  },

  getDefaultImageModel() {
    return (
      Object.values(IMAGE_MODELS).find((m) => m.isDefault && m.enabled) ||
      IMAGE_MODELS['stabilityai/stable-diffusion-2-1']
    );
  },

  getFallbackImageModel() {
    return IMAGE_MODELS['black-forest-labs/FLUX.1-schnell'];
  },

  /**
   * Get metadata for an embedding model
   */
  getEmbeddingModel(modelId) {
    const model = EMBEDDING_MODELS[modelId];
    if (!model || !model.enabled) {
      throw new ModelNotSupportedError(modelId);
    }
    return model;
  },

  listEmbeddingModels(fullMetadata = false) {
    const enabled = Object.values(EMBEDDING_MODELS).filter((m) => m.enabled);
    if (fullMetadata) return enabled;
    return enabled.map((m) => m.id);
  },

  getDefaultEmbeddingModel() {
    return (
      Object.values(EMBEDDING_MODELS).find((m) => m.isDefault && m.enabled) ||
      EMBEDDING_MODELS['sentence-transformers/all-MiniLM-L6-v2']
    );
  },

  /**
   * Get metadata for a chat / instruct LLM model
   */
  getChatModel(modelId) {
    const model = CHAT_MODELS[modelId];
    if (!model || !model.enabled) {
      throw new ModelNotSupportedError(modelId);
    }
    return model;
  },

  listChatModels(fullMetadata = false) {
    const enabled = Object.values(CHAT_MODELS).filter((m) => m.enabled);
    if (fullMetadata) return enabled;
    return enabled.map((m) => m.id);
  },

  getDefaultChatModel() {
    return (
      Object.values(CHAT_MODELS).find((m) => m.isDefault && m.enabled) ||
      CHAT_MODELS['meta-llama/Meta-Llama-3-8B-Instruct']
    );
  },

  /**
   * Get supported translation languages
   */
  getLanguages() {
    return SUPPORTED_LANGUAGES;
  },
};
