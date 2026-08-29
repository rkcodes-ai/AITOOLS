import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login.jsx';

// Mock axios to avoid Jest ESM transformation issue with react-scripts
jest.mock('axios', () => ({
  create: () => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
  }),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  get: jest.fn(),
  post: jest.fn(),
}));

// Mock the AuthContext
const mockLogin = jest.fn();
jest.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

describe('AITOOLS Neural Intelligence Login Experience', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. Renders AITOOLS Neural Intelligence branding, headline, and subtext', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/AI WORKSPACE/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Create\./i)).toBeInTheDocument();
    expect(screen.getByText(/Understand\./i)).toBeInTheDocument();
    expect(screen.getByText(/Discover\./i)).toBeInTheDocument();
    expect(screen.getByText(/One AI workspace\./i)).toBeInTheDocument();
  });

  test('2. Renders all 4 capability nodes (IMAGE, TEXT, TRANSLATE, KNOWLEDGE)', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/IMAGE/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/TEXT/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/TRANSLATE/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/KNOWLEDGE/i).length).toBeGreaterThan(0);
  });

  test('3. Renders login card with fields, Remember me, and Continue button', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText(/Welcome back\./i)).toBeInTheDocument();
    expect(screen.getByText(/Continue to AITOOLS\./i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByText(/Remember me/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Continue/i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).not.toBeDisabled();
  });

  test('4. Validates required fields before calling login API', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(submitBtn);

    expect(mockLogin).not.toHaveBeenCalled();
    expect(screen.getByText(/Email address is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
  });

  test('5. Validates email format on submission', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/^Email$/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const submitBtn = screen.getByRole('button', { name: /Continue/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    expect(mockLogin).not.toHaveBeenCalled();
    expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
  });

  test('6. Validates minimum password length', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/^Email$/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const submitBtn = screen.getByRole('button', { name: /Continue/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.click(submitBtn);

    expect(mockLogin).not.toHaveBeenCalled();
    expect(screen.getByText(/Password must be at least 6 characters/i)).toBeInTheDocument();
  });

  test('7. Password visibility toggle works correctly', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText(/^Password$/i);
    const toggleBtn = screen.getByRole('button', { name: /Show password/i });

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');

    // Click to reveal password
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /Hide password/i })).toHaveAttribute('aria-pressed', 'true');

    // Click to hide password again
    fireEvent.click(screen.getByRole('button', { name: /Hide password/i }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('8. Shows loading state when submitting login request', async () => {
    let resolveLogin;
    mockLogin.mockImplementation(() => new Promise((resolve) => { resolveLogin = resolve; }));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/^Email$/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const submitBtn = screen.getByRole('button', { name: /Continue/i });

    fireEvent.change(emailInput, { target: { value: 'alex@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Signing in\.\.\./i)).toBeInTheDocument();
    expect(mockLogin).toHaveBeenCalledWith('alex@example.com', 'password123');

    await act(async () => {
      resolveLogin({ success: true });
    });
  });

  test('9. Displays error banner when login fails', async () => {
    mockLogin.mockResolvedValue({ success: false, error: 'Invalid email or password' });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/^Email$/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const submitBtn = screen.getByRole('button', { name: /Continue/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
  });
});
