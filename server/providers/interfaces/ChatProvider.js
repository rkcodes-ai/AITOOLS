export class ChatProvider {
  constructor(name) {
    if (new.target === ChatProvider) {
      throw new TypeError('Cannot construct ChatProvider instances directly.');
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
   * Generate grounded chat response with context
   * @param {Object} params
   * @param {Array<{ role: string, content: string }>} params.messages
   * @param {string} params.context
   * @param {string} params.model
   * @param {Object} [params.options]
   * @returns {Promise<{ answer: string, model: string, provider: string, usage: Object }>}
   */
  async generateAnswer({ messages, context, model, options = {} }) {
    throw new Error('Method generateAnswer() must be implemented by concrete ChatProvider adapter.');
  }
}
