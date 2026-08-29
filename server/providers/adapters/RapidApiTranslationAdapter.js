import axios from 'axios';
import { TranslationProvider } from '../interfaces/TranslationProvider.js';
import { config } from '../../config/env.js';
import {
  ProviderError,
  ProviderRateLimitError,
  ProviderTimeoutError,
  ProviderAuthenticationError,
  ProviderConfigurationError,
} from '../errors/providerErrors.js';

export class RapidApiTranslationAdapter extends TranslationProvider {
  constructor() {
    super('rapidapi');
    this.timeoutMs = 25000;
  }

  isConfigured() {
    return Boolean(config.rapidapi.key);
  }

  _getApiKey() {
    if (!this.isConfigured()) {
      throw new ProviderConfigurationError(
        'rapidapi',
        'RAPID_API_KEY is not configured in server environment.'
      );
    }
    return config.rapidapi.key;
  }

  async translateText({ text, targetLang, sourceLang = 'en', options = {} }) {
    if (process.env.NODE_ENV === 'production' && !this.isConfigured()) {
      throw new ProviderConfigurationError(
        'rapidapi',
        'CRITICAL: RAPID_API_KEY is mandatory in production environment for translation services.'
      );
    }

    if (this.isConfigured()) {
      const apiKey = config.rapidapi.key;

      try {
        const response = await axios.post(
          'https://deep-translate1.p.rapidapi.com/language/translate/v2',
          {
            q: text,
            source: sourceLang,
            target: targetLang,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-RapidAPI-Key': apiKey,
              'X-RapidAPI-Host': 'deep-translate1.p.rapidapi.com',
            },
            timeout: this.timeoutMs,
          }
        );

        const translatedText =
          response.data?.data?.translations?.translatedText ||
          response.data?.translations?.translatedText;

        if (translatedText) {
          return {
            translatedText,
            targetLang,
            sourceLang,
            provider: this.name,
          };
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'production') {
          throw new ProviderError(
            `Production RapidAPI translation failed: ${error.message}`,
            502,
            false,
            'PROVIDER_ERROR',
            'rapidapi'
          );
        }
        console.warn(`[RapidApiTranslationAdapter] RapidAPI translation failed (${error.message}). Falling back to public engine.`);
      }
    }

    // Fallback: Public High-Performance Translation Engine (MyMemory - Development only)
    try {
      const langpair = `${sourceLang || 'en'}|${targetLang}`;
      const response = await axios.get('https://api.mymemory.translated.net/get', {
        params: {
          q: text,
          langpair,
        },
        timeout: 10000,
      });

      const translatedText = response.data?.responseData?.translatedText;
      if (translatedText) {
        return {
          translatedText,
          targetLang,
          sourceLang,
          provider: 'translation-engine',
          usedFallback: true,
        };
      }
    } catch (fallbackErr) {
      console.warn(`[RapidApiTranslationAdapter] MyMemory fallback failed: ${fallbackErr.message}`);
    }

    // Ultimate fallback if offline (Development only)
    return {
      translatedText: `[Translated to ${targetLang.toUpperCase()}]: ${text}`,
      targetLang,
      sourceLang,
      provider: 'translation-engine',
      usedFallback: true,
    };
  }
}
