import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { Documents } from '../pages/Documents.jsx';

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

const mockGetDocumentsApi = jest.fn().mockResolvedValue({ success: true, data: [] });

jest.mock('../services/api/documents.js', () => ({
  getDocumentsApi: (...args) => mockGetDocumentsApi(...args),
  uploadDocumentApi: jest.fn(),
  retryProcessingApi: jest.fn(),
  deleteDocumentApi: jest.fn(),
}));

jest.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { name: 'Elena Rostova', email: 'elena@aitools.io', role: 'Architect' },
    isAuthenticated: true,
    isLoading: false,
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

describe('AITOOLS Documents Management Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDocumentsApi.mockResolvedValue({ success: true, data: [] });
  });

  test('1. Renders the Documents page header, subtitle, and primary actions', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Documents />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Your Documents & AI Knowledge Library')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Upload PDFs and TXT files, track processing, and prepare your documents for AI-powered search and grounded answers.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upload Document/i })).toBeInTheDocument();
  });

  test('2. Renders all 4 document status filter tabs', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Documents />
        </MemoryRouter>
      );
    });

    expect(screen.getByRole('button', { name: 'All Documents' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ready for AI' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Processing' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Failed' })).toBeInTheDocument();
  });

  test('3. Renders document-name search bar with correct placeholder', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Documents />
        </MemoryRouter>
      );
    });

    expect(screen.getByPlaceholderText('Search documents by name...')).toBeInTheDocument();
  });

  test('4. Renders clean empty state when no documents exist', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Documents />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('No documents found')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Upload your first PDF or TXT document to begin processing and prepare it for AI-powered search and grounded answers.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upload Now/i })).toBeInTheDocument();
  });
});
