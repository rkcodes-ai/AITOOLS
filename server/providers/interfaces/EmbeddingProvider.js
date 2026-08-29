export class EmbeddingProvider {
  constructor(name) {
    if (new.target === EmbeddingProvider) {
      throw new TypeError('Cannot construct EmbeddingProvider instances directly.');
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
   * Generate vector embedding for a single text string
   * @param {Object} params
   * @param {string} params.text
   * @param {string} params.model
   * @param {Object} [params.options]
   * @returns {Promise<{ vector: number[], dimensions: number, model: string }>}
   */
  async embedText({ text, model, options = {} }) {
    throw new Error('Method embedText() must be implemented by concrete EmbeddingProvider adapter.');
  }

  /**
   * Generate vector embeddings for a batch of text strings
   * @param {Object} params
   * @param {string[]} params.texts
   * @param {string} params.model
   * @param {Object} [params.options]
   * @returns {Promise<Array<{ vector: number[], dimensions: number, model: string }>>}
   */
  async embedBatch({ texts, model, options = {} }) {
    throw new Error('Method embedBatch() must be implemented by concrete EmbeddingProvider adapter.');
  }
}
