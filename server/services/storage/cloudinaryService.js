import { v2 as cloudinary } from 'cloudinary';
import { config } from '../../config/env.js';
import { ConfigurationError, AppError } from '../../utils/errors.js';

let isConfigured = false;

const configureCloudinary = () => {
  if (isConfigured) return;

  const { cloudName, apiKey, apiSecret } = config.cloudinary;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new ConfigurationError(
      'Cloudinary credentials (CLOUD_NAME, API_KEY, API_SECRET) are not configured in server/.env.',
      'CLOUDINARY_NOT_CONFIGURED'
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  isConfigured = true;
};

/**
 * Uploads a local file to Cloudinary storage
 * @param {Object} params
 * @param {string} params.filePath - Local temporary path to image
 * @param {string} [params.folder] - Target Cloudinary folder
 * @returns {Promise<{ url: string, secureUrl: string, publicId: string }>}
 */
export const uploadImageToCloudinary = async ({ filePath, folder }) => {
  if (!filePath) {
    throw new AppError('File path is required for Cloudinary upload.', 400);
  }

  configureCloudinary();

  try {
    const uploadFolder = folder || config.cloudinary.folderName || 'mern_ai';
    const result = await cloudinary.uploader.upload(filePath, {
      folder: uploadFolder,
      resource_type: 'image',
    });

    return {
      url: result.url,
      secureUrl: result.secure_url || result.url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('[CloudinaryService] Upload failed:', error);
    if (error instanceof AppError) throw error;
    throw new AppError(error.message || 'Failed to upload image to cloud storage.', 502, 'STORAGE_UPLOAD_ERROR');
  }
};
