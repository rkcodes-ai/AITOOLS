import { AppError } from '../../utils/errors.js';

export class ProviderError extends AppError {
  constructor(message, status = 502, retryable = false, code = 'PROVIDER_ERROR', provider = 'unknown') {
    super(message, status, code, retryable);
    this.provider = provider;
  }
}

export class ProviderTimeoutError extends ProviderError {
  constructor(provider, timeoutMs) {
    super(`Provider '${provider}' request timed out after ${timeoutMs}ms.`, 504, true, 'PROVIDER_TIMEOUT', provider);
  }
}

export class ProviderRateLimitError extends ProviderError {
  constructor(provider, message = 'Rate limit exceeded by upstream AI provider.') {
    super(message, 429, true, 'PROVIDER_RATE_LIMIT', provider);
  }
}

export class ProviderUnavailableError extends ProviderError {
  constructor(provider, message = 'AI model or provider is temporarily unavailable / loading.') {
    super(message, 503, true, 'PROVIDER_UNAVAILABLE', provider);
  }
}

export class ProviderAuthenticationError extends ProviderError {
  constructor(provider, message = 'Authentication failed with upstream AI provider.') {
    super(message, 500, false, 'PROVIDER_AUTH_ERROR', provider);
  }
}

export class ProviderConfigurationError extends ProviderError {
  constructor(provider, message = 'Provider credentials are not configured in server environment.') {
    super(message, 500, false, 'PROVIDER_CONFIG_ERROR', provider);
  }
}

export class ModelNotSupportedError extends AppError {
  constructor(modelId) {
    super(`Requested AI model '${modelId}' is not supported or not found in model catalog.`, 400, 'MODEL_NOT_SUPPORTED', false);
  }
}
