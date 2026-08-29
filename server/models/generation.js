import mongoose from 'mongoose';

const GenerationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['image', 'summarize_url', 'summarize_text', 'translate'],
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      default: '',
    },
    prompt: {
      type: String,
      default: '',
    },
    input: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['completed', 'failed'],
      default: 'completed',
      index: true,
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

// Compound indexes for optimal per-user timeline, type filter, and status queries
GenerationSchema.index({ userId: 1, createdAt: -1 });
GenerationSchema.index({ userId: 1, type: 1, createdAt: -1 });
GenerationSchema.index({ userId: 1, status: 1 });

const Generation = mongoose.model('Generation', GenerationSchema);

export default Generation;
