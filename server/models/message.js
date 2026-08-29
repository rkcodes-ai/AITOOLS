import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    sources: [
      {
        documentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Document',
        },
        documentName: String,
        chunkId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'DocumentChunk',
        },
        pageStart: Number,
        pageEnd: Number,
        snippet: String,
        relevanceScore: Number,
      },
    ],
    model: {
      type: String,
      default: '',
    },
    provider: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['completed', 'failed'],
      default: 'completed',
    },
    errorCode: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

const Message = mongoose.model('Message', MessageSchema);

export default Message;
