import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Translate from '../pages/Translate.jsx';

// Mock axios
jest.mock('axios', () => ({
  create: () => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn().mockResolvedValue({ success: true, data: [] }),
    post: jest.fn(),
  }),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  get: jest.fn().mockResolvedValue({ success: true, data: [] }),
  post: jest.fn(),
}));

// Mock AI API
jest.mock('../services/api/ai', () => ({
  translateApi: jest.fn(() => Promise.resolve({
    success: true,
    data: {
      translatedText: 'Hola mundo, bienvenidos a la inteligencia artificial.',
      targetLang: 'es',
      sourceLang: 'en',
    },
  })),
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

import { translateApi } from '../services/api/ai';

describe('AITOOLS Dedicated Translate AI Workspace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    translateApi.mockResolvedValue({
      success: true,
      data: {
        translatedText: 'Hola mundo, bienvenidos a la inteligencia artificial.',
        targetLang: 'es',
        sourceLang: 'en',
      },
    });
  });

  test('1. Renders Translate Heading, Subtitle, and Language Control Bar', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Translate />
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/Translate with/i)).toBeInTheDocument();
    expect(screen.getByText(/Convert text between languages while preserving meaning and nuance\./i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Source Language/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Language/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Swap languages/i)).toBeInTheDocument();
  });

  test('2. Renders Source Textarea, Character Counter, and Empty Translation Panel', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Translate />
        </MemoryRouter>
      );
    });

    expect(screen.getByPlaceholderText(/Enter text to translate\.\.\./i)).toBeInTheDocument();
    expect(screen.getByText(/0 characters/i)).toBeInTheDocument();
    expect(screen.getByText('Translation')).toBeInTheDocument();
    expect(screen.getByText('Your translation will appear here.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Translate →' })).toBeInTheDocument();
  });

  test('3. Executes Translation workflow and displays output with Copy and Download actions', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Translate />
        </MemoryRouter>
      );
    });

    const textarea = screen.getByPlaceholderText(/Enter text to translate\.\.\./i);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Hello world, welcome to artificial intelligence.' } });
    });

    expect(screen.getByText(/48 characters/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: 'Translate →' });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(translateApi).toHaveBeenCalledWith({
      text: 'Hello world, welcome to artificial intelligence.',
      targetLanguage: 'es',
      sourceLang: 'en',
    });

    expect(screen.getByText('Hola mundo, bienvenidos a la inteligencia artificial.')).toBeInTheDocument();
    expect(screen.getAllByTitle(/Copy/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
  });

  test('4. Language swap button switches languages correctly', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Translate />
        </MemoryRouter>
      );
    });

    const srcSelect = screen.getByLabelText(/Source Language/i);
    const tgtSelect = screen.getByLabelText(/Target Language/i);
    const swapBtn = screen.getByLabelText(/Swap languages/i);

    expect(srcSelect.value).toBe('auto');
    expect(tgtSelect.value).toBe('es');

    await act(async () => {
      fireEvent.click(swapBtn);
    });

    expect(srcSelect.value).toBe('es');
    expect(tgtSelect.value).toBe('en');
  });

  test('5. Translate does not contain Text AI actions (Summarize, Rewrite, Explain, Analyze)', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Translate />
        </MemoryRouter>
      );
    });

    expect(screen.queryByRole('button', { name: 'Summarize' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rewrite' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Explain' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Analyze' })).not.toBeInTheDocument();
  });
});
