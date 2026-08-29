import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { DocumentStorageProvider } from './DocumentStorageProvider.js';
import { ConfigurationError, AppError } from '../../utils/errors.js';

/**
 * Lightweight AWS Signature Version 4 Helper for S3 REST API
 */
class S3Signer {
  static sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  static hmacSha256(key, data) {
    return crypto.createHmac('sha256', key).update(data).digest();
  }

  static getSignatureKey(key, dateStamp, regionName, serviceName) {
    const kDate = S3Signer.hmacSha256('AWS4' + key, dateStamp);
    const kRegion = S3Signer.hmacSha256(kDate, regionName);
    const kService = S3Signer.hmacSha256(kRegion, serviceName);
    return S3Signer.hmacSha256(kService, 'aws4_request');
  }

  static signRequest({
    method,
    url,
    headers = {},
    payloadHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    region = 'us-east-1',
    accessKeyId,
    secretAccessKey,
  }) {
    const parsedUrl = new URL(url);
    const host = parsedUrl.host;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    const canonicalHeadersObj = {
      ...headers,
      host,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
    };

    // Sort headers alphabetically
    const sortedHeaderKeys = Object.keys(canonicalHeadersObj)
      .map((k) => k.toLowerCase())
      .sort();

    const canonicalHeadersStr = sortedHeaderKeys
      .map((k) => `${k}:${canonicalHeadersObj[k] || ''}\n`)
      .join('');

    const signedHeadersStr = sortedHeaderKeys.join(';');

    const canonicalUri = parsedUrl.pathname || '/';
    const canonicalQueryString = parsedUrl.search ? parsedUrl.search.substring(1) : '';

    const canonicalRequest = [
      method.toUpperCase(),
      canonicalUri,
      canonicalQueryString,
      canonicalHeadersStr,
      signedHeadersStr,
      payloadHash,
    ].join('\n');

    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      S3Signer.sha256(canonicalRequest),
    ].join('\n');

    const signingKey = S3Signer.getSignatureKey(secretAccessKey, dateStamp, region, 's3');
    const signature = crypto
      .createHmac('sha256', signingKey)
      .update(stringToSign)
      .digest('hex');

    const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeadersStr}, Signature=${signature}`;

    return {
      ...canonicalHeadersObj,
      Authorization: authorizationHeader,
    };
  }
}

export class S3CompatibleStorageAdapter extends DocumentStorageProvider {
  constructor(options = {}) {
    super('s3-compatible');
    this.bucket = options.bucket || process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET;
    this.region = options.region || process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1';
    this.accessKeyId = options.accessKeyId || process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    this.secretAccessKey = options.secretAccessKey || process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
    this.endpoint = options.endpoint || process.env.S3_ENDPOINT || null;
    this.forcePathStyle = options.forcePathStyle || process.env.S3_FORCE_PATH_STYLE === 'true';
    this.timeoutMs = options.timeoutMs || 30000;
  }

  isConfigured() {
    return Boolean(this.bucket && this.accessKeyId && this.secretAccessKey);
  }

  _resolveObjectUrl(key) {
    const sanitizedKey = key.replace(/^\/+/, '');
    if (this.endpoint) {
      const baseEndpoint = this.endpoint.replace(/\/+$/, '');
      return this.forcePathStyle
        ? `${baseEndpoint}/${this.bucket}/${sanitizedKey}`
        : `${baseEndpoint}/${sanitizedKey}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${sanitizedKey}`;
  }

  async saveFile({ tempFilePath, buffer, originalFilename, userId }) {
    if (!this.isConfigured()) {
      throw new ConfigurationError(
        'S3CompatibleStorageAdapter is not configured. Missing S3_BUCKET_NAME, S3_ACCESS_KEY_ID, or S3_SECRET_ACCESS_KEY.',
        'STORAGE_NOT_CONFIGURED'
      );
    }

    const safeExt = path.extname(originalFilename || '').toLowerCase();
    const storageKey = `documents/${userId}/doc_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${safeExt}`;

    let fileBuffer;
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fileBuffer = await fs.promises.readFile(tempFilePath);
    } else if (buffer) {
      fileBuffer = buffer;
    } else {
      throw new AppError('No valid file source provided for S3 storage upload.', 400);
    }

    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const objectUrl = this._resolveObjectUrl(storageKey);
    const contentType = safeExt === '.pdf' ? 'application/pdf' : 'text/plain';

    const headers = S3Signer.signRequest({
      method: 'PUT',
      url: objectUrl,
      headers: {
        'content-type': contentType,
        'content-length': String(fileBuffer.length),
      },
      payloadHash: checksum,
      region: this.region,
      accessKeyId: this.accessKeyId,
      secretAccessKey: this.secretAccessKey,
    });

    try {
      await axios.put(objectUrl, fileBuffer, {
        headers,
        timeout: this.timeoutMs,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      return {
        storageKey,
        url: objectUrl,
        size: fileBuffer.length,
        checksum,
        buffer: fileBuffer,
        provider: this.name,
        isEphemeral: false,
      };
    } catch (error) {
      const status = error.response?.status || 502;
      const message = error.response?.data || error.message;
      console.error(`[S3CompatibleStorageAdapter] Upload failed for key '${storageKey}':`, message);
      throw new AppError(`Failed to upload document to S3 storage: ${error.message}`, status, 'STORAGE_UPLOAD_ERROR');
    }
  }

  async getFileBuffer(storageKey) {
    if (!this.isConfigured()) {
      throw new ConfigurationError(
        'S3CompatibleStorageAdapter is not configured for file retrieval.',
        'STORAGE_NOT_CONFIGURED'
      );
    }

    const objectUrl = this._resolveObjectUrl(storageKey);
    const headers = S3Signer.signRequest({
      method: 'GET',
      url: objectUrl,
      region: this.region,
      accessKeyId: this.accessKeyId,
      secretAccessKey: this.secretAccessKey,
    });

    try {
      const response = await axios.get(objectUrl, {
        headers,
        responseType: 'arraybuffer',
        timeout: this.timeoutMs,
      });
      return Buffer.from(response.data);
    } catch (error) {
      const status = error.response?.status || 502;
      if (status === 404) {
        throw new AppError(`Document '${storageKey}' not found on S3 storage.`, 404, 'DOCUMENT_NOT_FOUND');
      }
      throw new AppError(`Failed to retrieve document from S3 storage: ${error.message}`, status, 'STORAGE_READ_ERROR');
    }
  }

  async deleteFile(storageKey) {
    if (!this.isConfigured()) return false;

    const objectUrl = this._resolveObjectUrl(storageKey);
    const headers = S3Signer.signRequest({
      method: 'DELETE',
      url: objectUrl,
      region: this.region,
      accessKeyId: this.accessKeyId,
      secretAccessKey: this.secretAccessKey,
    });

    try {
      await axios.delete(objectUrl, { headers, timeout: 10000 });
      return true;
    } catch (error) {
      console.warn(`[S3CompatibleStorageAdapter] Failed to delete '${storageKey}':`, error.message);
      return false;
    }
  }

  async getHealth() {
    return {
      name: this.name,
      configured: this.isConfigured(),
      status: this.isConfigured() ? 'ready' : 'unconfigured',
      isEphemeral: false,
      bucket: this.bucket || null,
      region: this.region,
    };
  }
}
