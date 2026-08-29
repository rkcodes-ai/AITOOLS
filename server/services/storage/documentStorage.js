import { config } from '../../config/env.js';
import { LocalDocumentStorageAdapter } from './LocalDocumentStorageAdapter.js';
import { S3CompatibleStorageAdapter } from './S3CompatibleStorageAdapter.js';
import { ConfigurationError } from '../../utils/errors.js';

class DocumentStorageManager {
  constructor() {
    this._localAdapter = new LocalDocumentStorageAdapter();
    this._s3Adapter = new S3CompatibleStorageAdapter();
  }

  /**
   * Resolves the active document storage provider based on environment and configuration
   * @returns {import('./DocumentStorageProvider.js').DocumentStorageProvider}
   */
  getActiveProvider() {
    const driver = config.storage.driver; // 'auto' | 's3' | 'local'
    const isProd = process.env.NODE_ENV === 'production';

    if (driver === 's3') {
      if (!this._s3Adapter.isConfigured()) {
        throw new ConfigurationError(
          'STORAGE_DRIVER is explicitly set to "s3" but S3 credentials (S3_BUCKET_NAME, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY) are missing.',
          'STORAGE_NOT_CONFIGURED'
        );
      }
      return this._s3Adapter;
    }

    if (driver === 'local') {
      if (isProd) {
        throw new ConfigurationError(
          'CRITICAL: STORAGE_DRIVER cannot be set to "local" in production environment. Persistent object storage is mandatory.',
          'INVALID_PRODUCTION_STORAGE'
        );
      }
      return this._localAdapter;
    }

    // Auto resolution:
    if (this._s3Adapter.isConfigured()) {
      return this._s3Adapter;
    }

    if (isProd) {
      throw new ConfigurationError(
        'CRITICAL: Persistent S3-compatible object storage (S3_BUCKET_NAME, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY) is mandatory in production. Local filesystem storage is ephemeral and forbidden in production.',
        'STORAGE_NOT_CONFIGURED'
      );
    }

    // In development mode, fall back to safe local filesystem storage
    return this._localAdapter;
  }

  /**
   * Save uploaded file to active document storage provider
   */
  async saveFile(params) {
    const provider = this.getActiveProvider();
    return provider.saveFile(params);
  }

  /**
   * Retrieve file buffer by storage key
   */
  async getFileBuffer(storageKey) {
    // If the storage key is a local file format and local adapter has it, or delegating to active provider
    if (this._s3Adapter.isConfigured()) {
      try {
        return await this._s3Adapter.getFileBuffer(storageKey);
      } catch (err) {
        // In development mode with hybrid keys, try local adapter as fallback
        if (process.env.NODE_ENV !== 'production') {
          try {
            return await this._localAdapter.getFileBuffer(storageKey);
          } catch {
            throw err;
          }
        }
        throw err;
      }
    }

    const provider = this.getActiveProvider();
    return provider.getFileBuffer(storageKey);
  }

  /**
   * Delete file from active document storage provider
   */
  async deleteFile(storageKey) {
    if (this._s3Adapter.isConfigured()) {
      return this._s3Adapter.deleteFile(storageKey);
    }
    const provider = this.getActiveProvider();
    return provider.deleteFile(storageKey);
  }

  /**
   * Health status of document storage subsystem
   */
  async getHealth() {
    const isS3Configured = this._s3Adapter.isConfigured();
    const isProd = process.env.NODE_ENV === 'production';

    return {
      activeDriver: isS3Configured ? 's3-compatible' : 'local-filesystem',
      isPersistent: isS3Configured,
      isEphemeral: !isS3Configured,
      isProductionCompliant: isProd ? isS3Configured : true,
      s3: await this._s3Adapter.getHealth(),
      local: await this._localAdapter.getHealth(),
    };
  }
}

export const documentStorage = new DocumentStorageManager();
