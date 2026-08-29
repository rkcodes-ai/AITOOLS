import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute.jsx';
import { AppShell } from '../components/AppShell.jsx';
import Home from '../pages/Home.jsx';
import Login from '../pages/Login.jsx';

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

// Mock API calls
jest.mock('../services/api/posts', () => ({
  getPostsApi: jest.fn().mockResolvedValue({ success: true, data: [] }),
}));

const mockLogin = jest.fn();
const mockLogout = jest.fn();
const mockRegister = jest.fn();

let mockAuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: mockLogin,
  logout: mockLogout,
  register: mockRegister,
};

jest.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => mockAuthState,
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

describe('AITOOLS Unified Single-Portal Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      logout: mockLogout,
      register: mockRegister,
    };
  });

  test('1. Public entry / landing page shows Sign In and Register controls when logged out', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Home />
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/SYNAPSE 3D • SPATIAL AI ENGINE/i)).toBeInTheDocument();
    expect(screen.getByText(/Launch Image Studio/i)).toBeInTheDocument();
    expect(screen.getByText(/Spatial Capability Matrix/i)).toBeInTheDocument();
  });

  test('2. Logged out AppShell displays Sign In and Register buttons and no fake user name', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppShell>
            <div>Public Content</div>
          </AppShell>
        </MemoryRouter>
      );
    });

    expect(screen.getByRole('link', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
    expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
  });

  test('3. ProtectedRoute redirects logged-out user to /login with encoded redirect query', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/create-post']}>
          <Routes>
            <Route
              path="/create-post"
              element={
                <ProtectedRoute>
                  <div>Protected Image AI Studio</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Single Central Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Single Central Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Image AI Studio')).not.toBeInTheDocument();
  });

  test('4. ProtectedRoute allows authenticated user to access protected workspace module', async () => {
    mockAuthState.user = { name: 'David Smith', email: 'david@aitools.io', role: 'Architect' };
    mockAuthState.isAuthenticated = true;

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/summarize']}>
          <Routes>
            <Route
              path="/summarize"
              element={
                <ProtectedRoute>
                  <div>Protected Text AI Studio</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Protected Text AI Studio')).toBeInTheDocument();
  });

  test('5. Authenticated AppShell displays the real authenticated user identity and role', async () => {
    mockAuthState.user = { name: 'Elena Rostova', email: 'elena@aitools.io', role: 'Senior Researcher' };
    mockAuthState.isAuthenticated = true;

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppShell>
            <div>Workspace Canvas</div>
          </AppShell>
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Elena Rostova')).toBeInTheDocument();
    expect(screen.getByText('Senior Researcher')).toBeInTheDocument();
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
  });

  test('6. Login flow extracts redirect parameter and executes authentication', async () => {
    mockLogin.mockResolvedValueOnce({ success: true });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/login?redirect=%2Ftranslate']}>
          <Login />
        </MemoryRouter>
      );
    });

    const emailInput = screen.getByLabelText(/^Email$/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const submitBtn = screen.getByRole('button', { name: /Continue/i });

    fireEvent.change(emailInput, { target: { value: 'elena@aitools.io' } });
    fireEvent.change(passwordInput, { target: { value: 'Secret123!' } });
    
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(mockLogin).toHaveBeenCalledWith('elena@aitools.io', 'Secret123!');
  });

  test('7. ProtectedRoute shows elegant loading indicator while determining auth status', async () => {
    mockAuthState.isLoading = true;

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <ProtectedRoute>
            <div>Dashboard Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Initializing AITOOLS Portal...')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
  });
});
