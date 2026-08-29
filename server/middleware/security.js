import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

/**
 * Configure Helmet HTTP Security Headers
 */
export const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows Cloudinary/external media in React app
  contentSecurityPolicy: false, // Leave CSP to hosting/reverse proxy to prevent breaking external fonts/CDNs
});

/**
 * General API Rate Limiter
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP address. Please try again in a few minutes.',
      retryable: false,
    },
  },
});

/**
 * Stricter Rate Limiter for Expensive AI Operations
 */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // 60 AI generation/summarization calls per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AI_RATE_LIMIT_EXCEEDED',
      message: 'AI request limit reached for this IP. Please wait a few minutes before submitting more AI requests.',
      retryable: false,
    },
  },
});

/**
 * Upload Route Rate Limiter
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 uploads per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      message: 'Media upload rate limit reached. Please wait before creating more posts.',
      retryable: false,
    },
  },
});

/**
 * Knowledge Search Route Rate Limiter
 */
export const knowledgeSearchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // 60 searches per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'SEARCH_RATE_LIMIT_EXCEEDED',
      message: 'Knowledge search rate limit reached for this IP. Please wait a few minutes before submitting more search queries.',
      retryable: false,
    },
  },
});
