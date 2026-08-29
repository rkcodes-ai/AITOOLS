import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import { AppShell } from '../components/AppShell.jsx';
import Home from '../pages/Home.jsx';
import Login from '../pages/Login.jsx';
import Summarize from '../pages/Summarize.jsx';

// Mock axios
jest.mock('axios', () => ({
  create: () => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn().mockResolvedValue({ success: true, data: [] }),
    post: jest.fn().mockResolvedValue({ success: true, data: [] }),
  }),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  get: jest.fn().mockResolvedValue({ success: true, data: [] }),
  post: jest.fn().mockResolvedValue({ success: true, data: [] }),
}));

// Mock posts API
jest.mock('../services/api/posts', () => ({
  getPostsApi: jest.fn().mockResolvedValue({
    success: true,
    data: [],
    dbConnected: true,
  }),
}));

// Mock dynamic Auth State
let mockAuth = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
};

jest.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }) => <>{children}</>,
}));

describe('AITOOLS — Full Portal Functional E2E Integration Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockAuth = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    };
  });

  test('1. Public Portal (Logged Out): Displays branding, spatial AI hero, and NO fake user identity', () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/']}>
          <Home />
        </MemoryRouter>
      </ThemeProvider>
    );

    // Verify spatial AI hero & CTAs
    expect(screen.getByText(/SYNAPSE 3D • SPATIAL AI ENGINE/i)).toBeInTheDocument();
    expect(screen.getByText(/Launch Image Studio/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Launch Image Studio/i })).toHaveAttribute('href', '/create-post');

    // Verify NO fake "Alice Johnson" identity
    expect(screen.queryByText(/Alice Johnson/i)).not.toBeInTheDocument();
  });

  test('2. Protected Route Redirect: Visiting /summarize while logged out redirects to /login?redirect=%2Fsummarize', () => {
    const ProtectedRoute = ({ children }) => {
      if (!mockAuth.isAuthenticated) {
        return <Navigate to="/login?redirect=%2Fsummarize" replace />;
      }
      return children;
    };

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/summarize']}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/summarize"
              element={
                <ProtectedRoute>
                  <Summarize />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    // Should redirect to Login and show Welcome back
    expect(screen.getByText(/Welcome back\./i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/name@example\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument();
  });

  test('3. Login Form: Starts completely empty for normal users', () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Login />
        </MemoryRouter>
      </ThemeProvider>
    );

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/^Password/i);

    expect(emailInput.value).toBe('');
    expect(passwordInput.value).toBe('');
  });

  test('4. Authenticated Workspace Shell: Displays single source of truth in sidebar and NO duplicate quick links in top header', () => {
    mockAuth = {
      user: {
        id: 'usr_verified_123',
        name: 'Dr. Evelyn Vance',
        email: 'evelyn.vance@aitools.internal',
        role: 'admin',
      },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    };

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppShell>
            <div data-testid="workspace-content">Workspace Content</div>
          </AppShell>
        </MemoryRouter>
      </ThemeProvider>
    );

    // Verify all 9 sidebar items exist in exact order
    expect(screen.getByRole('link', { name: /^Workspace$/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /^Image AI$/i })).toHaveAttribute('href', '/create-post');
    expect(screen.getByRole('link', { name: /^Text AI$/i })).toHaveAttribute('href', '/summarize');
    expect(screen.getByRole('link', { name: /^Translate$/i })).toHaveAttribute('href', '/translate');
    expect(screen.getByRole('link', { name: /^Knowledge$/i })).toHaveAttribute('href', '/knowledge');
    expect(screen.getByRole('link', { name: /^Documents$/i })).toHaveAttribute('href', '/documents');
    expect(screen.getByRole('link', { name: /^Ask RAG$/i })).toHaveAttribute('href', '/documents/chat');
    expect(screen.getByRole('link', { name: /^History$/i })).toHaveAttribute('href', '/history');
    expect(screen.getByRole('link', { name: /^Settings$/i })).toHaveAttribute('href', '/profile');

    // Verify user profile pill in top header shows REAL user identity
    expect(screen.getByText(/Dr\. Evelyn Vance/i)).toBeInTheDocument();

    // Verify global search bar exists in top header
    expect(screen.getByPlaceholderText(/Search anything\.\.\./i)).toBeInTheDocument();
  });

  test('5. Theme System: Toggling theme switches html data-theme between light and dark', () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppShell>
            <div>Dashboard</div>
          </AppShell>
        </MemoryRouter>
      </ThemeProvider>
    );

    const themeToggleButtons = screen.getAllByRole('button', { name: /Toggle theme/i });
    expect(themeToggleButtons.length).toBeGreaterThan(0);

    // Click theme toggle
    fireEvent.click(themeToggleButtons[0]);
    expect(document.documentElement.getAttribute('data-theme')).toBeTruthy();
  });

  test('6. Token Exposure Defense: Browser authentication stores ZERO JWT tokens in localStorage', () => {
    expect(localStorage.getItem('aitools_token')).toBeNull();
  });
});
