/**
 * Base Abstract Text & Summarization Provider Interface
 */
export class TextProvider {
  constructor(name) {
    if (new.target === TextProvider) {
      throw new TypeError('Cannot construct TextProvider instances directly.');
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
   * Summarize raw text
   * @param {Object} params
   * @param {string} params.text
   * @param {number} [params.percentage]
   * @param {Object} [params.options]
   * @returns {Promise<{ summary: string, provider: string, metadata?: Object }>}
   */
  async summarizeText({ text, percentage = 40, options = {} }) {
    throw new Error('Method summarizeText() must be implemented.');
  }

  /**
   * Summarize article from a validated public URL
   * @param {Object} params
   * @param {string} params.url
   * @param {number} [params.length]
   * @param {string} [params.lang]
   * @param {Object} [params.options]
   * @returns {Promise<{ summary: string, url: string, provider: string, metadata?: Object }>}
   */
  async summarizeUrl({ url, length = 3, lang = null, options = {} }) {
    throw new Error('Method summarizeUrl() must be implemented.');
  }
}
