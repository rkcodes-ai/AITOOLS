import { HuggingFaceImageAdapter } from '../adapters/HuggingFaceImageAdapter.js';
import { RapidApiTextAdapter } from '../adapters/RapidApiTextAdapter.js';
import { RapidApiTranslationAdapter } from '../adapters/RapidApiTranslationAdapter.js';
import { HuggingFaceEmbeddingAdapter } from '../adapters/HuggingFaceEmbeddingAdapter.js';
import { HuggingFaceChatAdapter } from '../adapters/HuggingFaceChatAdapter.js';
import { ProviderError } from '../errors/providerErrors.js';

class ProviderRegistry {
  constructor() {
    this.imageProviders = new Map();
    this.textProviders = new Map();
    this.translationProviders = new Map();
    this.embeddingProviders = new Map();
    this.chatProviders = new Map();

    // Register standard default providers
    this.registerImageProvider('huggingface', new HuggingFaceImageAdapter());
    this.registerTextProvider('rapidapi', new RapidApiTextAdapter());
    this.registerTranslationProvider('rapidapi', new RapidApiTranslationAdapter());
    this.registerEmbeddingProvider('huggingface', new HuggingFaceEmbeddingAdapter());
    this.registerChatProvider('huggingface', new HuggingFaceChatAdapter());
  }

  registerImageProvider(name, providerInstance) {
    this.imageProviders.set(name.toLowerCase(), providerInstance);
  }

  registerTextProvider(name, providerInstance) {
    this.textProviders.set(name.toLowerCase(), providerInstance);
  }

  registerTranslationProvider(name, providerInstance) {
    this.translationProviders.set(name.toLowerCase(), providerInstance);
  }

  registerEmbeddingProvider(name, providerInstance) {
    this.embeddingProviders.set(name.toLowerCase(), providerInstance);
  }

  registerChatProvider(name, providerInstance) {
    this.chatProviders.set(name.toLowerCase(), providerInstance);
  }

  getImageProvider(name = 'huggingface') {
    const provider = this.imageProviders.get(name.toLowerCase());
    if (!provider) {
      throw new ProviderError(`Image generation provider '${name}' is not registered.`, 400, false, 'PROVIDER_NOT_REGISTERED', name);
    }
    return provider;
  }

  getTextProvider(name = 'rapidapi') {
    const provider = this.textProviders.get(name.toLowerCase());
    if (!provider) {
      throw new ProviderError(`Text provider '${name}' is not registered.`, 400, false, 'PROVIDER_NOT_REGISTERED', name);
    }
    return provider;
  }

  getTranslationProvider(name = 'rapidapi') {
    const provider = this.translationProviders.get(name.toLowerCase());
    if (!provider) {
      throw new ProviderError(`Translation provider '${name}' is not registered.`, 400, false, 'PROVIDER_NOT_REGISTERED', name);
    }
    return provider;
  }

  getEmbeddingProvider(name = 'huggingface') {
    const provider = this.embeddingProviders.get(name.toLowerCase());
    if (!provider) {
      throw new ProviderError(`Embedding provider '${name}' is not registered.`, 400, false, 'PROVIDER_NOT_REGISTERED', name);
    }
    return provider;
  }

  getChatProvider(name = 'huggingface') {
    const provider = this.chatProviders.get(name.toLowerCase());
    if (!provider) {
      throw new ProviderError(`Chat/LLM provider '${name}' is not registered.`, 400, false, 'PROVIDER_NOT_REGISTERED', name);
    }
    return provider;
  }

  async getHealth() {
    const health = {};

    for (const [name, provider] of this.imageProviders.entries()) {
      health[`image_${name}`] = await provider.getHealth();
    }
    for (const [name, provider] of this.textProviders.entries()) {
      health[`text_${name}`] = await provider.getHealth();
    }
    for (const [name, provider] of this.translationProviders.entries()) {
      health[`translation_${name}`] = await provider.getHealth();
    }
    for (const [name, provider] of this.embeddingProviders.entries()) {
      health[`embedding_${name}`] = await provider.getHealth();
    }
    for (const [name, provider] of this.chatProviders.entries()) {
      health[`chat_${name}`] = await provider.getHealth();
    }

    return health;
  }
}

export const providerRegistry = new ProviderRegistry();
