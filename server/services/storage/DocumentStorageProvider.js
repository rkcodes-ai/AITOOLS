/**
 * Abstract Base Document Storage Provider Interface
 */
export class DocumentStorageProvider {
  constructor(name) {
    if (new.target === DocumentStorageProvider) {
      throw new TypeError('Cannot construct DocumentStorageProvider instances directly.');
    }
    this.name = name;
  }

  /**
   * Save a file to the storage provider
   * @param {Object} params
   * @param {string} [params.tempFilePath]
   * @param {Buffer} [params.buffer]
   * @param {string} params.originalFilename
   * @param {string} params.userId
   * @returns {Promise<{ storageKey: string, filePath?: string, size: number, checksum: string, buffer?: Buffer, url?: string }>}
   */
  async saveFile(params) {
    throw new Error(`Method 'saveFile()' must be implemented by ${this.constructor.name}.`);
  }

  /**
   * Retrieve file buffer by storage key
   * @param {string} storageKey
   * @returns {Promise<Buffer>}
   */
  async getFileBuffer(storageKey) {
    throw new Error(`Method 'getFileBuffer()' must be implemented by ${this.constructor.name}.`);
  }

  /**
   * Delete a file by storage key
   * @param {string} storageKey
   * @returns {Promise<boolean>}
   */
  async deleteFile(storageKey) {
    throw new Error(`Method 'deleteFile()' must be implemented by ${this.constructor.name}.`);
  }

  /**
   * Check if the provider is properly configured
   * @returns {boolean}
   */
  isConfigured() {
    return true;
  }

  /**
   * Health inspection
   * @returns {Promise<{ name: string, configured: boolean, status: string, isEphemeral: boolean }>}
   */
  async getHealth() {
    return {
      name: this.name,
      configured: this.isConfigured(),
      status: this.isConfigured() ? 'ready' : 'unconfigured',
      isEphemeral: false,
    };
  }
}
