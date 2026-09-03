import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { LocalDocumentStorageAdapter } from '../../../services/storage/LocalDocumentStorageAdapter.js';
import { S3CompatibleStorageAdapter } from '../../../services/storage/S3CompatibleStorageAdapter.js';
import { documentStorage } from '../../../services/storage/documentStorage.js';
import { config } from '../../../config/env.js';
import { ConfigurationError } from '../../../utils/errors.js';

describe('Document Storage Hardening & S3 Abstraction Suite', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalS3Config = { ...config.storage.s3 };
  const originalDriver = config.storage.driver;

  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'storage-test-'));
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    config.storage.s3 = { ...originalS3Config };
    config.storage.driver = originalDriver;
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('1. LocalDocumentStorageAdapter Unit Tests', () => {
    it('should save file buffer and compute SHA-256 checksum', async () => {
      const adapter = new LocalDocumentStorageAdapter(tempDir);
      const testContent = Buffer.from('Test document content for local storage verification.');

      const result = await adapter.saveFile({
        buffer: testContent,
        originalFilename: 'test_doc.txt',
        userId: 'user_local_123',
      });

      assert.ok(result.storageKey);
      assert.ok(result.storageKey.startsWith('doc_user_local_123_'));
      assert.strictEqual(result.size, testContent.length);
      assert.strictEqual(result.provider, 'local-filesystem');
      assert.strictEqual(result.isEphemeral, true);
      assert.ok(fs.existsSync(result.filePath));

      // Retrieve buffer
      const readBuffer = await adapter.getFileBuffer(result.storageKey);
      assert.strictEqual(readBuffer.toString(), testContent.toString());

      // Delete file
      const deleteResult = await adapter.deleteFile(result.storageKey);
      assert.strictEqual(deleteResult, true);
      assert.strictEqual(fs.existsSync(result.filePath), false);
    });

    it('should throw error when reading non-existent file', async () => {
      const adapter = new LocalDocumentStorageAdapter(tempDir);
      await assert.rejects(
        async () => {
          await adapter.getFileBuffer('non_existent_key_999.txt');
        },
        (err) => {
          assert.ok(err.message.includes('not found'));
          return true;
        }
      );
    });

    it('should report health indicating ephemeral local storage', async () => {
      const adapter = new LocalDocumentStorageAdapter(tempDir);
      const health = await adapter.getHealth();
      assert.strictEqual(health.name, 'local-filesystem');
      assert.strictEqual(health.configured, true);
      assert.strictEqual(health.isEphemeral, true);
    });
  });

  describe('2. S3CompatibleStorageAdapter Unit Tests', () => {
    it('should evaluate isConfigured correctly', () => {
      const unconfigured = new S3CompatibleStorageAdapter({
        bucket: '',
        accessKeyId: '',
        secretAccessKey: '',
      });
      assert.strictEqual(unconfigured.isConfigured(), false);

      const configured = new S3CompatibleStorageAdapter({
        bucket: 'test-bucket',
        accessKeyId: 'TEST_ACCESS_KEY_ID',
        secretAccessKey: 'TEST_SECRET_ACCESS_KEY',
        region: 'us-east-1',
      });
      assert.strictEqual(configured.isConfigured(), true);
    });

    it('should correctly resolve standard AWS S3 vs custom endpoint URLs', () => {
      const standardS3 = new S3CompatibleStorageAdapter({
        bucket: 'prod-docs',
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        region: 'us-west-2',
      });
      const s3Url = standardS3._resolveObjectUrl('documents/user1/doc.pdf');
      assert.strictEqual(s3Url, 'https://prod-docs.s3.us-west-2.amazonaws.com/documents/user1/doc.pdf');

      const customR2 = new S3CompatibleStorageAdapter({
        bucket: 'r2-bucket',
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        endpoint: 'https://accountid.r2.cloudflarestorage.com',
        forcePathStyle: false,
      });
      const r2Url = customR2._resolveObjectUrl('documents/user1/doc.pdf');
      assert.strictEqual(r2Url, 'https://accountid.r2.cloudflarestorage.com/documents/user1/doc.pdf');

      const minio = new S3CompatibleStorageAdapter({
        bucket: 'minio-bucket',
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        endpoint: 'http://localhost:9000',
        forcePathStyle: true,
      });
      const minioUrl = minio._resolveObjectUrl('documents/user1/doc.pdf');
      assert.strictEqual(minioUrl, 'http://localhost:9000/minio-bucket/documents/user1/doc.pdf');
    });

    it('should throw ConfigurationError on saveFile if S3 credentials are missing', async () => {
      const adapter = new S3CompatibleStorageAdapter({
        bucket: '',
        accessKeyId: '',
        secretAccessKey: '',
      });

      await assert.rejects(
        async () => {
          await adapter.saveFile({
            buffer: Buffer.from('test'),
            originalFilename: 'doc.txt',
            userId: 'user1',
          });
        },
        (err) => {
          assert.ok(err instanceof ConfigurationError);
          assert.strictEqual(err.code, 'STORAGE_NOT_CONFIGURED');
          return true;
        }
      );
    });
  });

  describe('3. Document Storage Manager & Fail-Fast Resolution', () => {
    it('should resolve to local adapter in development when S3 is unconfigured', () => {
      process.env.NODE_ENV = 'development';
      config.storage.driver = 'auto';
      documentStorage._s3Adapter.bucket = '';
      documentStorage._s3Adapter.accessKeyId = '';
      documentStorage._s3Adapter.secretAccessKey = '';

      const provider = documentStorage.getActiveProvider();
      assert.strictEqual(provider.name, 'local-filesystem');
    });

    it('should fail-fast in production mode when S3 is unconfigured', () => {
      process.env.NODE_ENV = 'production';
      config.storage.driver = 'auto';
      documentStorage._s3Adapter.bucket = '';
      documentStorage._s3Adapter.accessKeyId = '';
      documentStorage._s3Adapter.secretAccessKey = '';

      assert.throws(
        () => {
          documentStorage.getActiveProvider();
        },
        (err) => {
          assert.ok(err instanceof ConfigurationError);
          assert.ok(err.message.includes('Persistent S3-compatible object storage'));
          assert.strictEqual(err.code, 'STORAGE_NOT_CONFIGURED');
          return true;
        }
      );
    });

    it('should fail-fast in production mode if STORAGE_DRIVER is explicitly set to local', () => {
      process.env.NODE_ENV = 'production';
      config.storage.driver = 'local';

      assert.throws(
        () => {
          documentStorage.getActiveProvider();
        },
        (err) => {
          assert.ok(err instanceof ConfigurationError);
          assert.strictEqual(err.code, 'INVALID_PRODUCTION_STORAGE');
          return true;
        }
      );
    });

    it('should resolve to S3 adapter in production when S3 credentials are provided', () => {
      process.env.NODE_ENV = 'production';
      config.storage.driver = 'auto';
      documentStorage._s3Adapter.bucket = 'prod-bucket';
      documentStorage._s3Adapter.accessKeyId = 'PROD_ACCESS_KEY';
      documentStorage._s3Adapter.secretAccessKey = 'PROD_SECRET_KEY';

      const provider = documentStorage.getActiveProvider();
      assert.strictEqual(provider.name, 's3-compatible');
    });

    it('should report comprehensive storage health status', async () => {
      process.env.NODE_ENV = 'development';
      documentStorage._s3Adapter.bucket = '';
      documentStorage._s3Adapter.accessKeyId = '';
      documentStorage._s3Adapter.secretAccessKey = '';

      const health = await documentStorage.getHealth();
      assert.ok('activeDriver' in health);
      assert.ok('isPersistent' in health);
      assert.ok('isEphemeral' in health);
      assert.ok('s3' in health);
      assert.ok('local' in health);
    });
  });
});
