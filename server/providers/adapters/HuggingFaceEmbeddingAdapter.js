import axios from 'axios';
import { EmbeddingProvider } from '../interfaces/EmbeddingProvider.js';
import { config } from '../../config/env.js';
import {
  ProviderError,
  ProviderRateLimitError,
  ProviderTimeoutError,
  ProviderUnavailableError,
  ProviderAuthenticationError,
  ProviderConfigurationError,
} from '../errors/providerErrors.js';

export class HuggingFaceEmbeddingAdapter extends EmbeddingProvider {
  constructor() {
    super('huggingface');
  }

  isConfigured() {
    return Boolean(config.huggingface.token);
  }

  async getHealth() {
    return {
      name: this.name,
      configured: this.isConfigured(),
      status: this.isConfigured() ? 'available' : 'unconfigured',
    };
  }

  async embedText({ text, model = 'sentence-transformers/all-MiniLM-L6-v2', options = {} }) {
    if (!this.isConfigured()) {
      throw new ProviderConfigurationError('huggingface', 'Hugging Face API token is not configured in the server environment.');
    }

    const url = `https://router.huggingface.co/hf-inference/pipeline/feature-extraction/${model}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.huggingface.token}`,
    };

    try {
      const response = await axios.post(
        url,
        {
          inputs: text,
          options: { wait_for_model: true },
        },
        {
          headers,
          timeout: 20000,
        }
      );

      // Feature extraction returns array of numbers (e.g. 384 dimensions)
      let vector = response.data;
      if (Array.isArray(vector) && Array.isArray(vector[0])) {
        // In case HF returns nested token embeddings, mean pool to 1D
        vector = vector[0];
      }

      if (!Array.isArray(vector) || vector.length === 0) {
        throw new ProviderError('Invalid vector format received from embedding provider.', 502, true, 'INVALID_EMBEDDING', this.name);
      }

      return {
        vector,
        dimensions: vector.length,
        model,
      };
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        throw new ProviderAuthenticationError('huggingface', err.message);
      }
      if (err.response?.status === 429) {
        throw new ProviderRateLimitError('huggingface', err.message);
      }
      if (err.response?.status === 503 || err.response?.status === 504) {
        throw new ProviderUnavailableError('huggingface', err.message);
      }
      if (err.code === 'ECONNABORTED') {
        throw new ProviderTimeoutError('huggingface', 20000);
      }
      throw new ProviderError(err.message || 'Failed to generate embedding from Hugging Face.', err.response?.status || 502, false, 'EMBEDDING_FAILED', this.name);
    }
  }

  async embedBatch({ texts, model = 'sentence-transformers/all-MiniLM-L6-v2', options = {} }) {
    const results = [];
    for (const text of texts) {
      const res = await this.embedText({ text, model, options });
      results.push(res);
    }
    return results;
  }
}
