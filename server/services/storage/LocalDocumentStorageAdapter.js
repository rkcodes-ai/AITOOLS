import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { DocumentStorageProvider } from './DocumentStorageProvider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_UPLOAD_DIR = path.resolve(__dirname, '../../../uploads/documents');

export class LocalDocumentStorageAdapter extends DocumentStorageProvider {
  constructor(customUploadDir) {
    super('local-filesystem');
    this.uploadDir = customUploadDir || DEFAULT_UPLOAD_DIR;
    this._ensureDirectory();
  }

  _ensureDirectory() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile({ tempFilePath, buffer, originalFilename, userId }) {
    this._ensureDirectory();
    const safeExt = path.extname(originalFilename || '').toLowerCase();
    const storageKey = `doc_${userId}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${safeExt}`;
    const destinationPath = path.join(this.uploadDir, storageKey);

    let fileBuffer;
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fileBuffer = await fs.promises.readFile(tempFilePath);
      await fs.promises.copyFile(tempFilePath, destinationPath);
    } else if (buffer) {
      fileBuffer = buffer;
      await fs.promises.writeFile(destinationPath, buffer);
    } else {
      throw new Error('No valid file source provided for local document storage.');
    }

    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    return {
      storageKey,
      filePath: destinationPath,
      size: fileBuffer.length,
      checksum,
      buffer: fileBuffer,
      provider: this.name,
      isEphemeral: true,
    };
  }

  async getFileBuffer(storageKey) {
    const sanitizedKey = path.basename(storageKey);
    const targetPath = path.join(this.uploadDir, sanitizedKey);
    if (!fs.existsSync(targetPath)) {
      throw new Error(`Document file '${sanitizedKey}' not found on local storage.`);
    }
    return fs.promises.readFile(targetPath);
  }

  async deleteFile(storageKey) {
    try {
      const sanitizedKey = path.basename(storageKey);
      const targetPath = path.join(this.uploadDir, sanitizedKey);
      if (fs.existsSync(targetPath)) {
        await fs.promises.unlink(targetPath);
      }
      return true;
    } catch (err) {
      console.warn(`[LocalDocumentStorageAdapter] Error deleting file ${storageKey}:`, err.message);
      return false;
    }
  }

  isConfigured() {
    return true;
  }

  async getHealth() {
    return {
      name: this.name,
      configured: true,
      status: 'ready',
      isEphemeral: true,
      uploadDir: this.uploadDir,
    };
  }
}
