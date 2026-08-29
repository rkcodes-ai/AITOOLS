import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectDB, closeDB, getDBStatus } from '../../../config/database.js';
import { getSystemHealth } from '../../../services/health/healthService.js';
import { getHealth } from '../../../controllers/healthController.js';
import { userRepository } from '../../../repositories/userRepository.js';
import { documentRepository } from '../../../repositories/documentRepository.js';
import { documentChunkRepository } from '../../../repositories/documentChunkRepository.js';
import { generationRepository } from '../../../repositories/generationRepository.js';
import { knowledgeCollectionRepository } from '../../../repositories/knowledgeCollectionRepository.js';
import { conversationRepository } from '../../../repositories/conversationRepository.js';
import { imagePresetRepository } from '../../../repositories/imagePresetRepository.js';
import { postRepository } from '../../../repositories/postRepository.js';
import { DatabaseError, ConfigurationError } from '../../../utils/errors.js';

// Import Mongoose Models to inspect index declarations
import User from '../../../models/user.js';
import Document from '../../../models/document.js';
import DocumentChunk from '../../../models/documentChunk.js';
import KnowledgeCollection from '../../../models/knowledgeCollection.js';
import Generation from '../../../models/generation.js';
import Conversation from '../../../models/conversation.js';
import Message from '../../../models/message.js';
import ImagePreset from '../../../models/imagePreset.js';
import Post from '../../../models/post.js';

describe('Production Database & Fail-Fast Persistence Suite', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalMongoUrl = process.env.MONGODB_URL;

  afterEach(async () => {
    process.env.NODE_ENV = originalEnv;
    process.env.MONGODB_URL = originalMongoUrl;
  });

  describe('1. Production Startup Fail-Fast Enforcement', () => {
    it('should throw ConfigurationError if MONGODB_URL is missing in production mode', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.MONGODB_URL;

      await assert.rejects(
        async () => {
          await connectDB();
        },
        (err) => {
          assert.ok(err instanceof ConfigurationError);
          assert.ok(err.message.includes('MONGODB_URL is mandatory in production'));
          return true;
        }
      );
    });

    it('should throw DatabaseError if MongoDB connection fails in production mode', async () => {
      process.env.NODE_ENV = 'production';
      // Invalid unreachable port with fast timeout
      process.env.MONGODB_URL = 'mongodb://127.0.0.1:59999/unreachable_db?serverSelectionTimeoutMS=500';

      await assert.rejects(
        async () => {
          await connectDB();
        },
        (err) => {
          assert.ok(err instanceof DatabaseError);
          assert.strictEqual(err.status, 503);
          assert.strictEqual(err.code, 'DATABASE_UNAVAILABLE');
          return true;
        }
      );
    });

    it('should allow running in development mode when MONGODB_URL is not set', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.MONGODB_URL;

      const result = await connectDB();
      assert.strictEqual(result, false);
      const status = getDBStatus();
      assert.strictEqual(status.connected, false);
    });
  });

  describe('2. Repository Layer Production Fail-Fast (No Silent RAM fallback)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('userRepository should reject with DatabaseError when DB is disconnected in production', async () => {
      assert.strictEqual(userRepository.isReady(), false);
      await assert.rejects(
        async () => {
          await userRepository.findByEmail('test@production.org');
        },
        (err) => {
          assert.ok(err instanceof DatabaseError);
          assert.strictEqual(err.status, 503);
          return true;
        }
      );
    });

    it('documentRepository should reject with DatabaseError when DB is disconnected in production', async () => {
      await assert.rejects(
        async () => {
          await documentRepository.create({ name: 'Prod Doc', userId: 'user_123' });
        },
        (err) => {
          assert.ok(err instanceof DatabaseError);
          return true;
        }
      );
    });

    it('documentChunkRepository should reject with DatabaseError when DB is disconnected in production', async () => {
      await assert.rejects(
        async () => {
          await documentChunkRepository.bulkInsertChunks([{ text: 'chunk' }]);
        },
        (err) => {
          assert.ok(err instanceof DatabaseError);
          return true;
        }
      );
    });

    it('generationRepository should reject with DatabaseError when DB is disconnected in production', async () => {
      await assert.rejects(
        async () => {
          await generationRepository.create({ prompt: 'Image prompt', userId: 'user_123' });
        },
        (err) => {
          assert.ok(err instanceof DatabaseError);
          return true;
        }
      );
    });

    it('knowledgeCollectionRepository should reject with DatabaseError when DB is disconnected in production', async () => {
      await assert.rejects(
        async () => {
          await knowledgeCollectionRepository.create({ name: 'Prod Col', userId: 'user_123' });
        },
        (err) => {
          assert.ok(err instanceof DatabaseError);
          return true;
        }
      );
    });

    it('conversationRepository should reject with DatabaseError when DB is disconnected in production', async () => {
      await assert.rejects(
        async () => {
          await conversationRepository.createConversation({ title: 'Prod Chat', userId: 'user_123' });
        },
        (err) => {
          assert.ok(err instanceof DatabaseError);
          return true;
        }
      );
    });

    it('imagePresetRepository should reject with DatabaseError when DB is disconnected in production', async () => {
      await assert.rejects(
        async () => {
          await imagePresetRepository.create({ name: 'Prod Preset', userId: 'user_123' });
        },
        (err) => {
          assert.ok(err instanceof DatabaseError);
          return true;
        }
      );
    });

    it('postRepository should reject with DatabaseError when DB is disconnected in production', async () => {
      await assert.rejects(
        async () => {
          await postRepository.create({ name: 'Prod Post', prompt: 'Prompt' });
        },
        (err) => {
          assert.ok(err instanceof DatabaseError);
          return true;
        }
      );
    });
  });

  describe('3. Schema Index Inspection & Integrity', () => {
    it('User model should define unique email index', () => {
      const emailPath = User.schema.path('email');
      assert.strictEqual(emailPath.options.unique, true);
    });

    it('Document model should define userId, checksum, and status compound indexes', () => {
      const indexes = Document.schema.indexes();
      const hasUserIdCreatedAt = indexes.some(
        ([idx]) => idx.userId === 1 && idx.createdAt === -1
      );
      const hasUserIdStatus = indexes.some(
        ([idx]) => idx.userId === 1 && idx.status === 1
      );
      assert.ok(hasUserIdCreatedAt, 'Missing compound index { userId: 1, createdAt: -1 }');
      assert.ok(hasUserIdStatus, 'Missing compound index { userId: 1, status: 1 }');
    });

    it('DocumentChunk model should define unique compound index on documentId and chunkIndex', () => {
      const indexes = DocumentChunk.schema.indexes();
      const hasUniqueChunkIndex = indexes.some(
        ([idx, opts]) => idx.documentId === 1 && idx.chunkIndex === 1 && opts?.unique === true
      );
      assert.ok(hasUniqueChunkIndex, 'Missing unique compound index { documentId: 1, chunkIndex: 1 }');
    });

    it('Generation model should define compound indexes for timeline and type filtering', () => {
      const indexes = Generation.schema.indexes();
      const hasTimeline = indexes.some(
        ([idx]) => idx.userId === 1 && idx.createdAt === -1
      );
      const hasTypeTimeline = indexes.some(
        ([idx]) => idx.userId === 1 && idx.type === 1 && idx.createdAt === -1
      );
      assert.ok(hasTimeline, 'Missing { userId: 1, createdAt: -1 }');
      assert.ok(hasTypeTimeline, 'Missing { userId: 1, type: 1, createdAt: -1 }');
    });

    it('KnowledgeCollection model should define userId and name indexes', () => {
      const indexes = KnowledgeCollection.schema.indexes();
      const hasTimeline = indexes.some(
        ([idx]) => idx.userId === 1 && idx.createdAt === -1
      );
      assert.ok(hasTimeline, 'Missing KnowledgeCollection { userId: 1, createdAt: -1 }');
    });

    it('Conversation model should define userId and updatedAt index', () => {
      const indexes = Conversation.schema.indexes();
      const hasUpdatedAt = indexes.some(
        ([idx]) => idx.userId === 1 && idx.updatedAt === -1
      );
      assert.ok(hasUpdatedAt, 'Missing Conversation { userId: 1, updatedAt: -1 }');
    });

    it('Message model should define conversationId and createdAt index', () => {
      const indexes = Message.schema.indexes();
      const hasConvCreatedAt = indexes.some(
        ([idx]) => idx.conversationId === 1 && idx.createdAt === 1
      );
      assert.ok(hasConvCreatedAt, 'Missing Message { conversationId: 1, createdAt: 1 }');
    });

    it('ImagePreset model should define userId index', () => {
      const indexes = ImagePreset.schema.indexes();
      const hasTimeline = indexes.some(
        ([idx]) => idx.userId === 1 && idx.createdAt === -1
      );
      assert.ok(hasTimeline, 'Missing ImagePreset { userId: 1, createdAt: -1 }');
    });

    it('Post model should define createdAt and compound userId indexes', () => {
      const indexes = Post.schema.indexes();
      const hasCreatedAt = indexes.some(
        ([idx]) => idx.createdAt === -1 && !idx.userId
      );
      const hasUserCreatedAt = indexes.some(
        ([idx]) => idx.userId === 1 && idx.createdAt === -1
      );
      assert.ok(hasCreatedAt, 'Missing Post { createdAt: -1 }');
      assert.ok(hasUserCreatedAt, 'Missing Post { userId: 1, createdAt: -1 }');
    });
  });

  describe('4. Database Health & Readiness Probe Evaluation', () => {
    it('should report sanitized database status without exposing credentials or URLs', () => {
      const dbStatus = getDBStatus();
      assert.ok('connected' in dbStatus);
      assert.ok('readyState' in dbStatus);
      assert.ok('host' in dbStatus);
      assert.ok('name' in dbStatus);

      // Verify no sensitive tokens or password leaks
      const serialized = JSON.stringify(dbStatus);
      assert.strictEqual(serialized.includes('password'), false);
      assert.strictEqual(serialized.includes('mongodb+srv'), false);
    });

    it('should return 503 Unhealthy in production mode when database is not connected', () => {
      process.env.NODE_ENV = 'production';
      let capturedStatus = null;
      let capturedBody = null;

      const mockRes = {
        status(code) {
          capturedStatus = code;
          return this;
        },
        json(body) {
          capturedBody = body;
          return this;
        },
      };

      getHealth({}, mockRes);
      assert.strictEqual(capturedStatus, 503);
      assert.strictEqual(capturedBody.status, 'unhealthy');
      assert.ok(capturedBody.message.includes('Database connection is required in production mode'));
    });

    it('should return 200 Degraded in development mode when database is disconnected', () => {
      process.env.NODE_ENV = 'development';
      let capturedStatus = null;
      let capturedBody = null;

      const mockRes = {
        status(code) {
          capturedStatus = code;
          return this;
        },
        json(body) {
          capturedBody = body;
          return this;
        },
      };

      getHealth({}, mockRes);
      assert.strictEqual(capturedStatus, 200);
      assert.strictEqual(capturedBody.status, 'degraded');
    });
  });

  describe('5. Connection Lifecycle & Graceful Teardown', () => {
    it('closeDB should complete gracefully even when disconnected', async () => {
      await assert.doesNotReject(async () => {
        await closeDB();
      });
      const status = getDBStatus();
      assert.strictEqual(status.connected, false);
    });
  });
});
