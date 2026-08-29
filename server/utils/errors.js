/**
 * Base Application Error
 */
export class AppError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR', retryable = false) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.statusCode = status;
    this.code = code;
    this.retryable = retryable;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, code = 'VALIDATION_ERROR') {
    super(message, 400, code, false);
  }
}

export class SSRFError extends AppError {
  constructor(message) {
    super(`URL validation failed: ${message}`, 400, 'SSRF_BLOCKED', false);
  }
}

export class ProviderError extends AppError {
  constructor(message, status = 502, retryable = false, code = 'PROVIDER_ERROR') {
    super(message, status, code, retryable);
  }
}

export class ConfigurationError extends AppError {
  constructor(message, code = 'MISSING_CONFIGURATION') {
    super(message, 500, code, false);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found.`, 404, 'NOT_FOUND', false);
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database is currently unavailable.') {
    super(message, 503, 'DATABASE_UNAVAILABLE', false);
  }
}
