import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      enum: ['application/pdf', 'text/plain'],
    },
    size: {
      type: Number,
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
    },
    checksum: {
      type: String,
      required: true,
      index: true,
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    characterCount: {
      type: Number,
      default: 0,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'ready', 'failed', 'deleted'],
      default: 'uploaded',
      index: true,
    },
    processingStage: {
      type: String,
      enum: ['uploaded', 'extracting', 'chunking', 'embedding', 'indexing', 'ready', 'failed'],
      default: 'uploaded',
    },
    errorCode: {
      type: String,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

DocumentSchema.index({ userId: 1, createdAt: -1 });
DocumentSchema.index({ userId: 1, status: 1 });

const Document = mongoose.model('Document', DocumentSchema);

export default Document;
