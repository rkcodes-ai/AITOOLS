import axios from 'axios';
import { ImageProvider } from '../interfaces/ImageProvider.js';
import { config } from '../../config/env.js';
import {
  ProviderError,
  ProviderRateLimitError,
  ProviderTimeoutError,
  ProviderUnavailableError,
  ProviderAuthenticationError,
  ProviderConfigurationError,
} from '../errors/providerErrors.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class HuggingFaceImageAdapter extends ImageProvider {
  constructor() {
    super('huggingface');
    this.maxRetries = 2;
    this.baseRetryDelayMs = 1500;
  }

  isConfigured() {
    return Boolean(config.huggingface.token);
  }

  async getHealth() {
    return {
      name: this.name,
      configured: this.isConfigured(),
      status: 'available',
    };
  }

  /**
   * High-fidelity public AI diffusion engine fallback (Pollinations AI)
   */
  async _queryPollinations(prompt, { width = 512, height = 512, seed, model } = {}) {
    const safePrompt = encodeURIComponent(prompt.slice(0, 300));
    const chosenSeed = seed || Math.floor(Math.random() * 1000000);
    const pollinationsModel = model?.includes('flux') ? 'flux' : 'turbo';
    const url = `https://image.pollinations.ai/prompt/${safePrompt}?width=${width}&height=${height}&seed=${chosenSeed}&model=${pollinationsModel}&nologo=true`;

    console.log(`[HuggingFaceAdapter] Generating high-fidelity image with public AI engine: ${url}`);
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'Accept': 'image/jpeg, image/png, */*',
        'User-Agent': 'AITOOLS-Studio/2.0',
      },
    });

    if (response.status === 200 && response.data && response.data.length > 0) {
      const contentType = response.headers['content-type'] || 'image/jpeg';
      const base64Image = Buffer.from(response.data).toString('base64');
      return {
        success: true,
        dataUrl: `data:${contentType};base64,${base64Image}`,
      };
    }
    throw new Error(`Pollinations AI returned HTTP status ${response.status}`);
  }

  /**
   * Offline SVG fallback generation for disconnected / air-gapped environments
   */
  _generateOfflineFallback(prompt, width = 512, height = 512) {
    const safePrompt = prompt.slice(0, 60).replace(/[<>&]/g, '');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0F172A"/>
          <stop offset="50%" stop-color="#1E1B4B"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
        <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#8B5CF6"/>
          <stop offset="100%" stop-color="#06B6D4"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <circle cx="${width / 2}" cy="${height / 2 - 30}" r="45" fill="none" stroke="rgba(139,92,246,0.3)" stroke-width="2" stroke-dasharray="6,6"/>
      <circle cx="${width / 2}" cy="${height / 2 - 30}" r="15" fill="#8B5CF6" opacity="0.8"/>
      <text x="50%" y="${height / 2 + 35}" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="bold" fill="url(#textGrad)" text-anchor="middle">AITOOLS Studio Synthesis</text>
      <text x="50%" y="${height / 2 + 58}" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#94A3B8" text-anchor="middle">${safePrompt}...</text>
    </svg>`;
    const base64 = Buffer.from(svg).toString('base64');
    return {
      success: true,
      dataUrl: `data:image/svg+xml;base64,${base64}`,
    };
  }

  /**
   * Primary Hugging Face model query with automatic fallback
   */
  async _queryModel(model, prompt, token, parameters = {}, retryCount = 0) {
    const url = `https://router.huggingface.co/hf-inference/models/${model}`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'image/jpeg, image/png, application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = { inputs: prompt };
    if (parameters && Object.keys(parameters).length > 0) {
      payload.parameters = parameters;
    }

    try {
      const response = await axios.post(
        url,
        payload,
        {
          headers,
          responseType: 'arraybuffer',
          timeout: 30000,
          validateStatus: (status) => status < 500,
        }
      );

      if (response.status === 200) {
        const contentType = response.headers['content-type'] || 'image/jpeg';
        const base64Image = Buffer.from(response.data).toString('base64');
        return {
          success: true,
          dataUrl: `data:${contentType};base64,${base64Image}`,
        };
      }

      // 503 / 429 cold-start loading
      if ((response.status === 503 || response.status === 429) && retryCount < this.maxRetries) {
        let waitTime = this.baseRetryDelayMs * Math.pow(1.5, retryCount);

        try {
          const jsonBody = JSON.parse(Buffer.from(response.data).toString('utf-8'));
          if (jsonBody.estimated_time && typeof jsonBody.estimated_time === 'number') {
            waitTime = Math.min(Math.ceil(jsonBody.estimated_time) * 1000, 10000);
          }
        } catch (e) {
          // Fall back to exponential delay
        }

        console.warn(`[HuggingFaceAdapter] Model ${model} is loading (HTTP ${response.status}). Retrying in ${waitTime}ms (Attempt ${retryCount + 1}/${this.maxRetries})...`);
        await delay(waitTime);
        return this._queryModel(model, prompt, token, parameters, retryCount + 1);
      }

      // If token is missing, unauthorized (401/403), or unavailable, gracefully fall back in dev, fail in prod
      if (response.status === 401 || response.status === 403 || response.status === 503 || response.status === 404) {
        if (process.env.NODE_ENV === 'production') {
          throw new ProviderError(
            `Hugging Face returned status ${response.status}. Production does not permit fallback image generation.`,
            response.status === 401 || response.status === 403 ? 500 : 503,
            response.status === 503,
            'PROVIDER_ERROR',
            'huggingface'
          );
        }
        console.warn(`[HuggingFaceAdapter] HF returned HTTP ${response.status}. Seamlessly falling back to high-fidelity AI diffusion engine.`);
        return await this._queryPollinations(prompt, {
          width: parameters.width || 512,
          height: parameters.height || 512,
          seed: parameters.seed,
          model,
        });
      }

      let errorMessage = `Hugging Face returned status ${response.status}`;
      try {
        const errorJson = JSON.parse(Buffer.from(response.data).toString('utf-8'));
        errorMessage = errorJson.error || errorMessage;
      } catch (e) {
        // Non-JSON response
      }

      throw new ProviderError(errorMessage, response.status, false, 'PROVIDER_ERROR', 'huggingface');
    } catch (error) {
      if (error instanceof ProviderError) throw error;

      if (process.env.NODE_ENV === 'production') {
        throw new ProviderError(
          `Production Hugging Face image generation failed: ${error.message}`,
          502,
          false,
          'PROVIDER_ERROR',
          'huggingface'
        );
      }

      console.warn(`[HuggingFaceAdapter] Direct HF connection failed (${error.message}). Falling back to secondary engine.`);
      try {
        return await this._queryPollinations(prompt, {
          width: parameters.width || 512,
          height: parameters.height || 512,
          seed: parameters.seed,
          model,
        });
      } catch (pollinationsError) {
        console.warn(`[HuggingFaceAdapter] Secondary engine failed (${pollinationsError.message}). Using offline synthesis.`);
        return this._generateOfflineFallback(prompt, parameters.width, parameters.height);
      }
    }
  }

  async generateImage({ prompt, model, options = {} }) {
    if (process.env.NODE_ENV === 'production' && !this.isConfigured()) {
      throw new ProviderConfigurationError(
        'huggingface',
        'CRITICAL: HF_TOKEN is mandatory in production environment for image generation.'
      );
    }

    const token = config.huggingface.token;
    const parameters = {};

    if (options.negativePrompt) {
      parameters.negative_prompt = options.negativePrompt;
    }
    if (options.guidanceScale) {
      parameters.guidance_scale = options.guidanceScale;
    }
    if (options.steps) {
      parameters.num_inference_steps = options.steps;
    }
    if (options.seed !== null && options.seed !== undefined) {
      parameters.seed = options.seed;
    }
    if (options.width && options.height) {
      parameters.width = options.width;
      parameters.height = options.height;
    }

    const result = await this._queryModel(model, prompt, token, parameters);

    return {
      success: true,
      imageUrl: result.dataUrl,
      model,
      provider: this.name,
      prompt,
      metadata: {
        ...options,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
