import { documentRepository } from '../../repositories/documentRepository.js';
import { documentChunkRepository } from '../../repositories/documentChunkRepository.js';
import { knowledgeCollectionRepository } from '../../repositories/knowledgeCollectionRepository.js';
import { documentStorage } from '../storage/documentStorage.js';
import { documentTextExtractor } from './documentTextExtractor.js';
import { chunkingService } from './chunkingService.js';
import { providerRegistry } from '../../providers/registry/providerRegistry.js';
import { modelRegistry } from '../../providers/registry/modelRegistry.js';
import { ValidationError, AppError } from '../../utils/errors.js';
import { ProviderConfigurationError } from '../../providers/errors/providerErrors.js';

const ALLOWED_MIME_TYPES = ['application/pdf', 'text/plain'];
const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export const documentService = {
  /**
   * Upload and register a new document for processing
   */
  async uploadDocument({ file, name, userId }) {
    if (!userId) {
      throw new AppError('Authentication required to upload documents.', 401, 'UNAUTHORIZED');
    }

    if (!file) {
      throw new ValidationError('A document file (PDF or TXT) is required for upload.', 'MISSING_FILE');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new ValidationError(
        `Invalid file type '${file.mimetype}'. Only PDF and TXT documents are supported.`,
        'INVALID_MIME_TYPE'
      );
    }

    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      throw new ValidationError(
        `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum limit of 10MB.`,
        'FILE_TOO_LARGE'
      );
    }

    const displayName = (name || file.name.replace(/\.[^/.]+$/, '')).trim().slice(0, 150);

    // Save to document storage
    const storageResult = await documentStorage.saveFile({
      tempFilePath: file.tempFilePath,
      buffer: file.data,
      originalFilename: file.name,
      userId,
    });

    // Create Document record
    const document = await documentRepository.create({
      userId,
      name: displayName,
      originalFilename: file.name,
      mimeType: file.mimetype,
      size: storageResult.size,
      storageKey: storageResult.storageKey,
      checksum: storageResult.checksum,
      status: 'uploaded',
      processingStage: 'uploaded',
    });

    // Trigger processing asynchronously in background
    setImmediate(() => {
      this.processDocument(document._id, userId).catch((err) => {
        console.error(`[DocumentService] Background processing error for ${document._id}:`, err.message);
      });
    });

    return document;
  },

  /**
   * Execute full extraction, chunking, and embedding pipeline for a document
   */
  async processDocument(documentId, userId) {
    const document = await documentRepository.findByIdForUser(documentId, userId);
    if (!document) {
      throw new AppError('Document not found for processing.', 404, 'DOCUMENT_NOT_FOUND');
    }

    try {
      // 1. Stage: Extracting
      await documentRepository.updateStatus(documentId, userId, {
        status: 'processing',
        processingStage: 'extracting',
        errorCode: null,
        errorMessage: null,
      });

      const fileBuffer = await documentStorage.getFileBuffer(document.storageKey);
      const extracted = await documentTextExtractor.extract({
        buffer: fileBuffer,
        mimeType: document.mimeType,
        originalFilename: document.originalFilename,
      });

      // 2. Stage: Chunking
      await documentRepository.updateStatus(documentId, userId, {
        processingStage: 'chunking',
        pageCount: extracted.pageCount,
        characterCount: extracted.characterCount,
      });

      const chunks = chunkingService.chunkDocument({
        pages: extracted.pages,
        documentId: document._id,
        userId,
      });

      if (chunks.length === 0) {
        throw new Error('Document produced 0 readable text chunks.');
      }

      // Idempotency: Clean up any old chunks before re-inserting
      await documentChunkRepository.deleteChunksByDocumentId(documentId, userId);
      await documentChunkRepository.bulkInsertChunks(chunks);

      // 3. Stage: Embedding
      await documentRepository.updateStatus(documentId, userId, {
        processingStage: 'embedding',
        chunkCount: chunks.length,
      });

      const embeddingProvider = providerRegistry.getEmbeddingProvider('huggingface');
      const defaultModel = modelRegistry.getDefaultEmbeddingModel();

      if (process.env.NODE_ENV === 'production' && !embeddingProvider.isConfigured()) {
        throw new ProviderConfigurationError(
          'huggingface',
          'CRITICAL: HF_TOKEN is mandatory in production environment for document chunk embeddings.'
        );
      }

      if (embeddingProvider.isConfigured()) {
        const savedChunks = await documentChunkRepository.findChunksByDocumentId(documentId, userId);
        for (const chunk of savedChunks) {
          try {
            const embedRes = await embeddingProvider.embedText({
              text: chunk.text,
              model: defaultModel.id,
            });
            await documentChunkRepository.updateChunkEmbedding(chunk._id, userId, embedRes.vector);
          } catch (embedErr) {
            console.warn(`[DocumentService] Chunk embedding failed: ${embedErr.message}`);
          }
        }
      } else {
        console.log(`[DocumentService] Embedding provider unconfigured. Storing text chunks for keyword/offline mode.`);
      }

      // 4. Stage: Ready
      return documentRepository.updateStatus(documentId, userId, {
        status: 'ready',
        processingStage: 'ready',
        chunkCount: chunks.length,
      });
    } catch (err) {
      console.error(`[DocumentService] Processing failed for ${documentId}:`, err);
      return documentRepository.updateStatus(documentId, userId, {
        status: 'failed',
        processingStage: 'failed',
        errorCode: err.code || 'PROCESSING_ERROR',
        errorMessage: err.message || 'Error occurred while processing document.',
      });
    }
  },

  async retryProcessing(documentId, userId) {
    const document = await documentRepository.findByIdForUser(documentId, userId);
    if (!document) {
      throw new AppError('Document not found.', 404, 'DOCUMENT_NOT_FOUND');
    }

    setImmediate(() => {
      this.processDocument(documentId, userId).catch((err) => {
        console.error(`[DocumentService] Retry error:`, err.message);
      });
    });

    return { message: 'Document processing retry scheduled.' };
  },

  async getUserDocuments(userId, queryParams = {}) {
    return documentRepository.findManyForUser(userId, queryParams);
  },

  async getDocumentDetails(documentId, userId) {
    const document = await documentRepository.findByIdForUser(documentId, userId);
    if (!document) {
      throw new AppError('Document not found.', 404, 'DOCUMENT_NOT_FOUND');
    }

    const chunks = await documentChunkRepository.findChunksByDocumentId(documentId, userId);
    return {
      document,
      chunks: chunks.map((c) => ({
        _id: c._id,
        chunkIndex: c.chunkIndex,
        pageStart: c.pageStart,
        pageEnd: c.pageEnd,
        tokenEstimate: c.tokenEstimate,
        textSnippet: c.text.slice(0, 150) + (c.text.length > 150 ? '...' : ''),
        hasEmbedding: Boolean(c.embedding && c.embedding.length > 0),
      })),
    };
  },

  async deleteDocument(documentId, userId) {
    const document = await documentRepository.findByIdForUser(documentId, userId);
    if (!document) {
      throw new AppError('Document not found.', 404, 'DOCUMENT_NOT_FOUND');
    }

    // Delete physical file
    await documentStorage.deleteFile(document.storageKey);

    // Delete chunks
    await documentChunkRepository.deleteChunksByDocumentId(documentId, userId);

    // Clean up collection references
    await knowledgeCollectionRepository.removeDocumentFromAllCollections(documentId, userId);

    // Delete document record
    await documentRepository.deleteForUser(documentId, userId);

    return { message: 'Document and all associated vector chunks deleted successfully.' };
  },
};
