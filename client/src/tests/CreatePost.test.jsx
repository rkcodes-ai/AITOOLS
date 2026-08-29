import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import CreatePost from '../pages/CreatePost.jsx';

// Mock axios
jest.mock('axios', () => ({
  create: () => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn().mockResolvedValue({ success: true, data: [] }),
    post: jest.fn(),
    delete: jest.fn(),
  }),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  get: jest.fn().mockResolvedValue({ success: true, data: [] }),
  post: jest.fn(),
  delete: jest.fn(),
}));

// Mock API calls
const mockImageModels = [
  { id: 'stabilityai/stable-diffusion-2-1', name: 'Stable Diffusion 2.1' },
  { id: 'black-forest-labs/FLUX.1-schnell', name: 'FLUX.1 Schnell' },
  { id: 'stabilityai/stable-diffusion-xl-base-1.0', name: 'SDXL Base 1.0' },
  { id: 'runwayml/stable-diffusion-v1-5', name: 'Stable Diffusion 1.5' },
];

jest.mock('../services/api/ai', () => ({
  generateImageApi: jest.fn(() => Promise.resolve({
    success: true,
    data: {
      imageUrl: 'https://example.com/mock-image.jpg',
      model: 'stabilityai/stable-diffusion-2-1',
      provider: 'huggingface',
      options: { aspectRatio: '1:1' },
      seed: 42,
      durationMs: 1250,
    },
  })),
  getAIConfigApi: jest.fn(() => Promise.resolve({
    success: true,
    data: {
      imageModels: mockImageModels,
    },
  })),
}));

jest.mock('../services/api/posts', () => ({
  createPostApi: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock('../services/api/presets', () => ({
  getPresetsApi: jest.fn(() => Promise.resolve({ success: true, data: [] })),
  createPresetApi: jest.fn(() => Promise.resolve({ success: true })),
  deletePresetApi: jest.fn(() => Promise.resolve({ success: true })),
}));

// Mock AuthContext
jest.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { name: 'Alice Johnson', email: 'alice@aitools.io', role: 'Student' },
    isAuthenticated: true,
    isLoading: false,
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

import { generateImageApi, getAIConfigApi } from '../services/api/ai';
import { getPresetsApi } from '../services/api/presets';

describe('AITOOLS Image AI Studio 10/10 UI Polish', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAIConfigApi.mockResolvedValue({
      success: true,
      data: {
        imageModels: mockImageModels,
      },
    });
    getPresetsApi.mockResolvedValue({
      success: true,
      data: [],
    });
    generateImageApi.mockResolvedValue({
      success: true,
      data: {
        imageUrl: 'https://example.com/mock-image.jpg',
        model: 'stabilityai/stable-diffusion-2-1',
        provider: 'huggingface',
        options: { aspectRatio: '1:1' },
        seed: 42,
        durationMs: 1250,
      },
    });
  });

  test('1. Renders refined Hero with "Create with AI." and supporting text', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <CreatePost />
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/Create with/i)).toBeInTheDocument();
    expect(screen.getByText(/Turn your ideas into images\./i)).toBeInTheDocument();
  });

  test('2. Renders primary prompt area with "Describe your image" and placeholder', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <CreatePost />
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/Describe your image/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Describe what you want to create\.\.\./i)).toBeInTheDocument();
    expect(screen.getByText(/Prompt Builder/i)).toBeInTheDocument();
    expect(screen.getByText(/Surprise Me/i)).toBeInTheDocument();
  });

  test('3. Renders Model selection with 4 core models', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <CreatePost />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByText('Stable Diffusion 2.1')).toBeInTheDocument();
    expect(screen.getByText('FLUX.1 Schnell')).toBeInTheDocument();
    expect(screen.getByText('SDXL Base 1.0')).toBeInTheDocument();
    expect(screen.getByText('Stable Diffusion 1.5')).toBeInTheDocument();
  });

  test('4. Renders Aspect ratio and Quality controls', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <CreatePost />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Aspect ratio')).toBeInTheDocument();
    expect(screen.getByText('1:1')).toBeInTheDocument();
    expect(screen.getByText('16:9')).toBeInTheDocument();
    expect(screen.getByText('9:16')).toBeInTheDocument();

    expect(screen.getByText('Quality')).toBeInTheDocument();
    expect(screen.getByText('Fast')).toBeInTheDocument();
    expect(screen.getByText('Balanced')).toBeInTheDocument();
    expect(screen.getByText('High Quality')).toBeInTheDocument();
  });

  test('5. Advanced parameters are collapsed by default and expandable', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <CreatePost />
        </MemoryRouter>
      );
    });

    const advButton = screen.getByText(/Advanced parameters/i);
    expect(advButton).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/e\.g\. blurry/i)).not.toBeInTheDocument();

    // Expand
    await act(async () => {
      fireEvent.click(advButton);
    });

    expect(screen.getByPlaceholderText(/e\.g\. blurry/i)).toBeInTheDocument();
    expect(screen.getByText(/Inference Steps/i)).toBeInTheDocument();
  });

  test('6. Renders empty preview canvas with "Your image will appear here."', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <CreatePost />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Your image will appear here.')).toBeInTheDocument();
    expect(screen.getByText('Describe an idea and generate.')).toBeInTheDocument();
  });

  test('7. Renders "Generate image" CTA button', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <CreatePost />
        </MemoryRouter>
      );
    });

    expect(screen.getByRole('button', { name: /Generate image/i })).toBeInTheDocument();
  });

  test('8. Real image generation flow displays photo, download and favorite controls', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <CreatePost />
        </MemoryRouter>
      );
    });

    const textarea = screen.getByPlaceholderText(/Describe what you want to create\.\.\./i);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'A futuristic cybernetic tiger' } });
    });

    const generateBtn = screen.getByRole('button', { name: /Generate image/i });
    await act(async () => {
      fireEvent.click(generateBtn);
    });

    expect(screen.getByRole('img', { name: /A futuristic cybernetic tiger/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Regenerate/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add to favorites/i })).toBeInTheDocument();
  });

  test('9. Error state displays clear user message and "Try again" action', async () => {
    generateImageApi.mockRejectedValueOnce(new Error('AI server busy'));

    await act(async () => {
      render(
        <MemoryRouter>
          <CreatePost />
        </MemoryRouter>
      );
    });

    const textarea = screen.getByPlaceholderText(/Describe what you want to create\.\.\./i);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Test prompt' } });
    });

    const generateBtn = screen.getByRole('button', { name: /Generate image/i });
    await act(async () => {
      fireEvent.click(generateBtn);
    });

    expect(screen.getByText("Couldn't create the image.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument();
  });
});
