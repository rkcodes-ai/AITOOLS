/**
 * Base Abstract Translation Provider Interface
 */
export class TranslationProvider {
  constructor(name) {
    if (new.target === TranslationProvider) {
      throw new TypeError('Cannot construct TranslationProvider instances directly.');
    }
    this.name = name;
  }

  isConfigured() {
    throw new Error('Method isConfigured() must be implemented.');
  }

  async getHealth() {
    return {
      name: this.name,
      configured: this.isConfigured(),
      status: this.isConfigured() ? 'available' : 'not_configured',
    };
  }

  /**
   * Translate text to target language
   * @param {Object} params
   * @param {string} params.text
   * @param {string} params.targetLang
   * @param {string} [params.sourceLang]
   * @param {Object} [params.options]
   * @returns {Promise<{ translatedText: string, targetLang: string, sourceLang: string, provider: string }>}
   */
  async translateText({ text, targetLang, sourceLang = 'en', options = {} }) {
    throw new Error('Method translateText() must be implemented.');
  }
}
