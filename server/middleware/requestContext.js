import crypto from 'crypto';

/**
 * Request Context Middleware
 * Generates correlation ID and tracks request lifecycle
 */
export const requestContextMiddleware = (req, res, next) => {
  const existingId = req.headers['x-request-id'];
  const requestId = existingId || `req_${crypto.randomBytes(8).toString('hex')}`;

  req.requestId = requestId;
  req.startTime = Date.now();

  res.setHeader('X-Request-Id', requestId);

  // Response duration tracking
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    if (res.statusCode >= 400) {
      console.warn(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms) [${requestId}]`);
    }
  });

  next();
};
