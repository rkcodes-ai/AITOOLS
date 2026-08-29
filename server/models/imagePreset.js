import mongoose from 'mongoose';

const ImagePresetSchema = new mongoose.Schema(
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
    configuration: {
      model: {
        type: String,
        default: 'stabilityai/stable-diffusion-2-1',
      },
      aspectRatio: {
        type: String,
        default: '1:1',
      },
      negativePrompt: {
        type: String,
        default: '',
      },
      guidanceScale: {
        type: Number,
        default: 7.5,
      },
      steps: {
        type: Number,
        default: 30,
      },
      quality: {
        type: String,
        default: 'balanced',
      },
    },
  },
  {
    timestamps: true,
  }
);

ImagePresetSchema.index({ userId: 1, createdAt: -1 });

const ImagePreset = mongoose.model('ImagePreset', ImagePresetSchema);

export default ImagePreset;
