import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Summarize from '../pages/Summarize.jsx';

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
  summarizeApi: jest.fn(() => Promise.resolve({
    success: true,
    data: {
      summary: 'This is a high quality AI generated summary of the source text.',
    },
  })),
  translateApi: jest.fn(() => Promise.resolve({
    success: true,
    data: {
      translatedText: 'Este es un resumen generado por IA de alta calidad.',
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

import { summarizeApi } from '../services/api/ai';

describe('AITOOLS Text AI Workspace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    summarizeApi.mockResolvedValue({
      success: true,
      data: {
        summary: 'This is a high quality AI generated summary of the source text.',
      },
    });
  });

  test('1. Renders refined Heading and Subtitle for Text AI', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Summarize />
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/Understand with/i)).toBeInTheDocument();
    expect(screen.getByText(/Understand, transform, and improve text with AI\./i)).toBeInTheDocument();
  });

  test('2. Renders Input Card with "Your text" and comfortable placeholder', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Summarize />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Your text')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste text or a URL to get started\.\.\./i)).toBeInTheDocument();
  });

  test('3. Renders Action segmented controls (Summarize, Rewrite, Explain, Improve, Analyze)', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Summarize />
        </MemoryRouter>
      );
    });

    expect(screen.getByRole('button', { name: 'Summarize' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rewrite' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explain' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Improve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analyze' })).toBeInTheDocument();
    
    // Translation controls should NOT be primary actions on Text AI page
    expect(screen.queryByRole('button', { name: 'Summarize & Translate' })).not.toBeInTheDocument();
  });

  test('4. Primary CTA, Result Heading, and Empty States dynamically update according to selected action', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Summarize />
        </MemoryRouter>
      );
    });

    // Default Summarize
    expect(screen.getByRole('button', { name: 'Summarize →' })).toBeInTheDocument();
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Your summary will appear here.')).toBeInTheDocument();
    expect(screen.getByText('Enter text and run Summarize to get started.')).toBeInTheDocument();

    // Select Rewrite
    const rewriteBtn = screen.getByRole('button', { name: 'Rewrite' });
    await act(async () => {
      fireEvent.click(rewriteBtn);
    });
    expect(screen.getByRole('button', { name: 'Rewrite →' })).toBeInTheDocument();
    expect(screen.getByText('Rewritten Text')).toBeInTheDocument();
    expect(screen.getByText('Your rewritten text will appear here.')).toBeInTheDocument();
    expect(screen.getByText('Enter text and run Rewrite to get started.')).toBeInTheDocument();

    // Select Explain
    const explainBtn = screen.getByRole('button', { name: 'Explain' });
    await act(async () => {
      fireEvent.click(explainBtn);
    });
    expect(screen.getByRole('button', { name: 'Explain →' })).toBeInTheDocument();
    expect(screen.getByText('Explanation')).toBeInTheDocument();
    expect(screen.getByText('Your explanation will appear here.')).toBeInTheDocument();
    expect(screen.getByText('Enter text and run Explain to get started.')).toBeInTheDocument();

    // Select Improve
    const improveBtn = screen.getByRole('button', { name: 'Improve' });
    await act(async () => {
      fireEvent.click(improveBtn);
    });
    expect(screen.getByRole('button', { name: 'Improve →' })).toBeInTheDocument();
    expect(screen.getByText('Improved Text')).toBeInTheDocument();
    expect(screen.getByText('Your improved text will appear here.')).toBeInTheDocument();
    expect(screen.getByText('Enter text and run Improve to get started.')).toBeInTheDocument();

    // Select Analyze
    const analyzeBtn = screen.getByRole('button', { name: 'Analyze' });
    await act(async () => {
      fireEvent.click(analyzeBtn);
    });
    expect(screen.getByRole('button', { name: 'Analyze →' })).toBeInTheDocument();
    expect(screen.getByText('Analysis')).toBeInTheDocument();
    expect(screen.getByText('Your analysis will appear here.')).toBeInTheDocument();
    expect(screen.getByText('Enter text and run Analyze to get started.')).toBeInTheDocument();
  });

  test('5. Executes Summarize and displays result with Copy and Download actions', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Summarize />
        </MemoryRouter>
      );
    });

    const textarea = screen.getByPlaceholderText(/Paste text or a URL to get started\.\.\./i);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Artificial Intelligence is revolutionizing modern computing across industries.' } });
    });

    const submitBtn = screen.getByRole('button', { name: 'Summarize →' });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(summarizeApi).toHaveBeenCalledWith({
      text: 'Artificial Intelligence is revolutionizing modern computing across industries.',
      action: 'Summarize',
    });
    expect(screen.getByText(/This is a high quality AI generated summary of the source text\./i)).toBeInTheDocument();
    expect(screen.getByTitle('Copy result')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
  });

  test('6. Executes Rewrite action mode correctly', async () => {
    summarizeApi.mockResolvedValueOnce({
      success: true,
      data: {
        summary: 'Modern computing across multiple industries is being revolutionized by AI.',
      },
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <Summarize />
        </MemoryRouter>
      );
    });

    const rewriteBtn = screen.getByRole('button', { name: 'Rewrite' });
    await act(async () => {
      fireEvent.click(rewriteBtn);
    });

    const textarea = screen.getByPlaceholderText(/Paste text or a URL to get started\.\.\./i);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Artificial Intelligence is revolutionizing modern computing across industries.' } });
    });

    const submitBtn = screen.getByRole('button', { name: 'Rewrite →' });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(summarizeApi).toHaveBeenCalledWith({
      text: 'Artificial Intelligence is revolutionizing modern computing across industries.',
      action: 'Rewrite',
    });
    expect(screen.getByText('Modern computing across multiple industries is being revolutionized by AI.')).toBeInTheDocument();
  });

  test('7. Switching actions preserves input text while resetting previous result', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Summarize />
        </MemoryRouter>
      );
    });

    const textarea = screen.getByPlaceholderText(/Paste text or a URL to get started\.\.\./i);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Sample article content' } });
    });

    const submitBtn = screen.getByRole('button', { name: 'Summarize →' });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(screen.getByText('This is a high quality AI generated summary of the source text.')).toBeInTheDocument();

    // Switch to Explain
    const explainBtn = screen.getByRole('button', { name: 'Explain' });
    await act(async () => {
      fireEvent.click(explainBtn);
    });

    // Input text is preserved, result pane is reset to Explain empty state
    expect(textarea.value).toBe('Sample article content');
    expect(screen.getByText('Your explanation will appear here.')).toBeInTheDocument();
    expect(screen.queryByText('This is a high quality AI generated summary of the source text.')).not.toBeInTheDocument();
  });
});
