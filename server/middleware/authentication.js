import rateLimit from 'express-rate-limit';
import { verifyToken } from '../utils/jwt.js';
import { AppError } from '../utils/errors.js';
import { config } from '../config/env.js';

/**
 * Authentication Rate Limiter (20 attempts / 15 min per IP)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
      retryable: false,
    },
  },
});

/**
 * Extracts and verifies JWT from Authorization header or cookie
 */
const extractUserFromRequest = (req) => {
  let token = null;

  // 1. Authorization header: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Cookie fallback
  if (!token && req.cookies && req.cookies[config.auth.cookieName]) {
    token = req.cookies[config.auth.cookieName];
  }

  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded || !decoded.sub) return null;

  return {
    id: decoded.sub,
    name: decoded.name,
    email: decoded.email,
    role: decoded.role || 'user',
  };
};

/**
 * Required Authentication Middleware
 */
export const authenticateUser = (req, res, next) => {
  const user = extractUserFromRequest(req);
  if (!user) {
    return next(new AppError('Authentication is required to access this resource.', 401, 'UNAUTHORIZED'));
  }

  req.user = user;
  next();
};

/**
 * Optional Authentication Middleware (enriches req.user if present, proceeds if absent)
 */
export const optionalAuthenticateUser = (req, res, next) => {
  req.user = extractUserFromRequest(req);
  next();
};

/**
 * Role-Based Authorization Middleware
 */
export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication is required.', 401, 'UNAUTHORIZED'));
    }

    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      return next(new AppError(`Access forbidden: '${requiredRole}' role required.`, 403, 'FORBIDDEN'));
    }

    next();
  };
};
