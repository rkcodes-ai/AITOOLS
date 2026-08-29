import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    photo: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for pagination and fast user-post filtering
PostSchema.index({ createdAt: -1 });
PostSchema.index({ userId: 1, createdAt: -1 });

const Post = mongoose.model('Post', PostSchema);

export default Post;