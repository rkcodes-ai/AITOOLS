import mongoose from 'mongoose';

const KnowledgeCollectionSchema = new mongoose.Schema(
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
      maxlength: 100,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    documentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

KnowledgeCollectionSchema.index({ userId: 1, createdAt: -1 });
KnowledgeCollectionSchema.index({ userId: 1, name: 1 });

const KnowledgeCollection = mongoose.model('KnowledgeCollection', KnowledgeCollectionSchema);

export default KnowledgeCollection;
