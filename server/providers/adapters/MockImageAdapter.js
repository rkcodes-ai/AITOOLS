import { ImageProvider } from '../interfaces/ImageProvider.js';

export class MockImageAdapter extends ImageProvider {
  constructor(name = 'mock-image-provider') {
    super(name);
    this.shouldFail = false;
    this.failStatus = 500;
    this.failMessage = 'Simulated mock provider failure';
  }

  isConfigured() {
    return true;
  }

  setFailureMode(shouldFail = true, status = 500, message = 'Simulated failure') {
    this.shouldFail = shouldFail;
    this.failStatus = status;
    this.failMessage = message;
  }

  async generateImage({ prompt, model, options = {} }) {
    if (this.shouldFail) {
      throw new Error(this.failMessage);
    }

    return {
      success: true,
      imageUrl: `data:image/png;base64,mockImageDataForPrompt_${Buffer.from(prompt).toString('base64').slice(0, 20)}`,
      model,
      provider: this.name,
      prompt,
      metadata: {
        mock: true,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}
