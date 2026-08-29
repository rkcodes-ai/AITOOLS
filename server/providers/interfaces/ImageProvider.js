/**
 * Base Abstract Image Generation Provider Interface
 */
export class ImageProvider {
  constructor(name) {
    if (new.target === ImageProvider) {
      throw new TypeError('Cannot construct ImageProvider instances directly.');
    }
    this.name = name;
  }

  /**
   * Check if provider credentials are configured
   * @returns {boolean}
   */
  isConfigured() {
    throw new Error('Method isConfigured() must be implemented.');
  }

  /**
   * Get health status of the provider
   * @returns {Promise<{ status: string, configured: boolean }>}
   */
  async getHealth() {
    return {
      name: this.name,
      configured: this.isConfigured(),
      status: this.isConfigured() ? 'available' : 'not_configured',
    };
  }

  /**
   * Generate an image from a prompt
   * @param {Object} params
   * @param {string} params.prompt
   * @param {string} params.model
   * @param {Object} [params.options]
   * @returns {Promise<{ success: boolean, imageUrl: string, model: string, provider: string, prompt: string, metadata?: Object }>}
   */
  async generateImage({ prompt, model, options = {} }) {
    throw new Error('Method generateImage() must be implemented.');
  }
}
