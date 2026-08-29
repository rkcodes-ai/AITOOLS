import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { Knowledge } from '../pages/Knowledge.jsx';

// Mock axios
jest.mock('axios', () => ({
  create: () => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn().mockResolvedValue({ success: true, data: [] }),
    post: jest.fn().mockResolvedValue({ success: true, data: { results: [] } }),
    delete: jest.fn().mockResolvedValue({ success: true }),
  }),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  get: jest.fn().mockResolvedValue({ success: true, data: [] }),
  post: jest.fn().mockResolvedValue({ success: true, data: { results: [] } }),
  delete: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock Knowledge and Documents APIs
const mockSearchKnowledgeApi = jest.fn();
const mockGetCollectionsApi = jest.fn().mockResolvedValue({ success: true, data: [] });
const mockGetDocumentsApi = jest.fn().mockResolvedValue({ success: true, data: [] });

jest.mock('../services/api/knowledge.js', () => ({
  searchKnowledgeApi: (...args) => mockSearchKnowledgeApi(...args),
  getCollectionsApi: (...args) => mockGetCollectionsApi(...args),
  createCollectionApi: jest.fn().mockResolvedValue({ success: true, data: { name: 'Test' } }),
  deleteCollectionApi: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../services/api/documents.js', () => ({
  getDocumentsApi: (...args) => mockGetDocumentsApi(...args),
}));

// Mock AuthContext
jest.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { name: 'Dr. Evelyn Reed', email: 'evelyn@aitools.io', role: 'Researcher' },
    isAuthenticated: true,
    isLoading: false,
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

describe('AITOOLS Knowledge Engine - Semantic Search Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCollectionsApi.mockResolvedValue({ success: true, data: [] });
    mockGetDocumentsApi.mockResolvedValue({ success: true, data: [] });
  });

  test('1. Renders the search-oriented initial empty state and prominent search bar', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Knowledge />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Search your knowledge base')).toBeInTheDocument();
    expect(
      screen.getByText('Enter a query to find relevant passages across your documents and collections.')
    ).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(
      'Search by conceptual meaning or exact terms across your documents...'
    );
    expect(searchInput).toBeInTheDocument();
    expect(screen.getByText(/Collections \(0\)/i)).toBeInTheDocument();
  });

  test('2. Shows loading state "Searching your knowledge base..." during search query', async () => {
    let resolveSearch;
    mockSearchKnowledgeApi.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSearch = resolve;
        })
    );

    await act(async () => {
      render(
        <MemoryRouter>
          <Knowledge />
        </MemoryRouter>
      );
    });

    const searchInput = screen.getByPlaceholderText(
      'Search by conceptual meaning or exact terms across your documents...'
    );
    const searchBtn = screen.getByRole('button', { name: /^Search$/i });

    fireEvent.change(searchInput, { target: { value: 'quantum computing architecture' } });
    fireEvent.click(searchBtn);

    expect(screen.getByText('Searching your knowledge base...')).toBeInTheDocument();

    await act(async () => {
      resolveSearch({
        success: true,
        data: {
          queryInfo: { normalizedQuery: 'quantum computing architecture', semanticSearchActive: true },
          results: [],
        },
      });
    });
  });

  test('3. Displays "No relevant knowledge found" when search returns zero results', async () => {
    mockSearchKnowledgeApi.mockResolvedValueOnce({
      success: true,
      data: {
        queryInfo: { normalizedQuery: 'unmatched query term', semanticSearchActive: true },
        results: [],
      },
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <Knowledge />
        </MemoryRouter>
      );
    });

    const searchInput = screen.getByPlaceholderText(
      'Search by conceptual meaning or exact terms across your documents...'
    );
    const searchBtn = screen.getByRole('button', { name: /^Search$/i });

    fireEvent.change(searchInput, { target: { value: 'unmatched query term' } });

    await act(async () => {
      fireEvent.click(searchBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('No relevant knowledge found')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Try different keywords or a more specific query.')
    ).toBeInTheDocument();
  });

  test('4. Renders ranked retrieved passages with relevance score, document name, page, and snippet', async () => {
    mockSearchKnowledgeApi.mockResolvedValueOnce({
      success: true,
      data: {
        queryInfo: { normalizedQuery: 'deep residual networks', semanticSearchActive: true },
        results: [
          {
            chunkId: 'chunk-101',
            rank: 1,
            documentId: 'doc-001',
            documentName: 'ResNet_Deep_Residual_Learning.pdf',
            mimeType: 'application/pdf',
            pageStart: 4,
            pageEnd: 4,
            finalScore: 0.942,
            semanticScore: 0.95,
            keywordScore: 0.88,
            explanation: 'High semantic match with residual connection architecture',
            snippet: 'Deep residual networks introduce identity shortcut connections that ease the training of networks that are substantially deeper than those used previously.',
          },
        ],
      },
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <Knowledge />
        </MemoryRouter>
      );
    });

    const searchInput = screen.getByPlaceholderText(
      'Search by conceptual meaning or exact terms across your documents...'
    );
    const searchBtn = screen.getByRole('button', { name: /^Search$/i });

    fireEvent.change(searchInput, { target: { value: 'deep residual networks' } });

    await act(async () => {
      fireEvent.click(searchBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('ResNet_Deep_Residual_Learning.pdf')).toBeInTheDocument();
    });

    expect(screen.getByText('Relevance: 94.2%')).toBeInTheDocument();
    expect(screen.getByText(/Page 4/i)).toBeInTheDocument();
    expect(screen.getByText(/Deep residual networks introduce identity shortcut connections/i)).toBeInTheDocument();
    expect(screen.getByText(/High semantic match with residual connection architecture/i)).toBeInTheDocument();
  });
});
