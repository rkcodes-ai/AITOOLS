import mongoose from 'mongoose';

const DocumentChunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    pageStart: {
      type: Number,
      default: 1,
    },
    pageEnd: {
      type: Number,
      default: 1,
    },
    characterStart: {
      type: Number,
      default: 0,
    },
    characterEnd: {
      type: Number,
      default: 0,
    },
    tokenEstimate: {
      type: Number,
      default: 0,
    },
    embedding: {
      type: [Number],
      default: [],
    },
    embeddingStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

DocumentChunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true });
DocumentChunkSchema.index({ userId: 1, documentId: 1 });

const DocumentChunk = mongoose.model('DocumentChunk', DocumentChunkSchema);

export default DocumentChunk;
