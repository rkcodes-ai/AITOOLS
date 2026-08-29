/**
 * Centralized Application Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  const requestId = req.requestId || 'req_unknown';
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred.';
  const code = err.code || 'INTERNAL_ERROR';
  const retryable = err.retryable || false;

  // Structured internal error logging
  if (status >= 500) {
    console.error(`[Error] [${requestId}] ${req.method} ${req.originalUrl}:`, {
      code,
      message,
      stack: err.stack,
    });
  } else {
    console.warn(`[Warn] [${requestId}] ${req.method} ${req.originalUrl}: ${message} (${code})`);
  }

  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      retryable,
      requestId,
    },
  });
};
