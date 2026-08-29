import * as dotenv from 'dotenv';

dotenv.config();

const getEnv = (key, defaultValue = '') => {
  return process.env[key] ? process.env[key].trim() : defaultValue;
};

export const config = {
  server: {
    port: parseInt(getEnv('PORT', '8080'), 10),
    env: getEnv('NODE_ENV', 'development'),
    isDev: getEnv('NODE_ENV', 'development') === 'development',
    isProd: getEnv('NODE_ENV') === 'production',
  },
  cors: {
    clientUrl: getEnv('CLIENT_URL', 'http://localhost:3000'),
    allowedOrigins: [
      getEnv('CLIENT_URL'),
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ].filter(Boolean),
  },
  mongodb: {
    url: getEnv('MONGODB_URL', 'mongodb://127.0.0.1:27017/aitools'),
    isConfigured: Boolean(process.env.MONGODB_URL),
  },
  cloudinary: {
    cloudName: getEnv('CLOUD_NAME'),
    apiKey: getEnv('API_KEY'),
    apiSecret: getEnv('API_SECRET'),
    folderName: getEnv('FOLDER_NAME', 'aitools'),
    isConfigured: Boolean(process.env.CLOUD_NAME && process.env.API_KEY && process.env.API_SECRET),
  },
  huggingface: {
    token: getEnv('HF_TOKEN') || getEnv('HUGGINGFACE_API_KEY'),
    isConfigured: Boolean(getEnv('HF_TOKEN') || getEnv('HUGGINGFACE_API_KEY')),
  },
  rapidapi: {
    key: getEnv('RAPID_API_KEY') || getEnv('RAPIDAPI_KEY'),
    isConfigured: Boolean(getEnv('RAPID_API_KEY') || getEnv('RAPIDAPI_KEY')),
  },
  storage: {
    driver: getEnv('STORAGE_DRIVER', 'auto'), // 's3' | 'local' | 'auto'
    s3: {
      bucket: getEnv('S3_BUCKET_NAME') || getEnv('AWS_S3_BUCKET'),
      region: getEnv('S3_REGION') || getEnv('AWS_REGION', 'us-east-1'),
      accessKeyId: getEnv('S3_ACCESS_KEY_ID') || getEnv('AWS_ACCESS_KEY_ID'),
      secretAccessKey: getEnv('S3_SECRET_ACCESS_KEY') || getEnv('AWS_SECRET_ACCESS_KEY'),
      endpoint: getEnv('S3_ENDPOINT'),
      forcePathStyle: getEnv('S3_FORCE_PATH_STYLE', 'false') === 'true',
    },
    isS3Configured: Boolean(
      (getEnv('S3_BUCKET_NAME') || getEnv('AWS_S3_BUCKET')) &&
      (getEnv('S3_ACCESS_KEY_ID') || getEnv('AWS_ACCESS_KEY_ID')) &&
      (getEnv('S3_SECRET_ACCESS_KEY') || getEnv('AWS_SECRET_ACCESS_KEY'))
    ),
  },
  auth: {
    jwtSecret: getEnv('JWT_SECRET', 'aitools-secure-secret-key-32-chars-long-prod-use'),
    jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '15m'),
    refreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
    cookieName: 'aitools_session',
  },
  limits: {
    maxJsonBodyBytes: '2mb',
    maxUploadFileSizeBytes: 10 * 1024 * 1024, // 10MB
    maxPromptLength: 1000,
    maxTextSummarizeLength: 50000,
    maxTranslateLength: 20000,
  },
};

export const getConfigurationSummary = () => {
  return {
    environment: config.server.env,
    port: config.server.port,
    mongodbConfigured: config.mongodb.isConfigured,
    cloudinaryConfigured: config.cloudinary.isConfigured,
    huggingFaceConfigured: config.huggingface.isConfigured,
    rapidApiConfigured: config.rapidapi.isConfigured,
    s3StorageConfigured: config.storage.isS3Configured,
  };
};
