import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Register from '../pages/Register.jsx';

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
const mockRegister = jest.fn();
jest.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    register: mockRegister,
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

describe('AITOOLS Neural Intelligence Register Experience', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. Renders AITOOLS Neural Intelligence registration branding and headline', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/AI WORKSPACE/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Create\./i)).toBeInTheDocument();
    expect(screen.getByText(/Understand\./i)).toBeInTheDocument();
    expect(screen.getByText(/Discover\./i)).toBeInTheDocument();
  });

  test('2. Renders registration form fields and default Create account button', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    expect(screen.getByText(/Build your workspace\./i)).toBeInTheDocument();
    expect(screen.getByText(/Start with AITOOLS\./i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Create account/i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).not.toBeDisabled();
  });

  test('3. Validates required fields before calling register API', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Create account/i });
    fireEvent.click(submitBtn);

    expect(mockRegister).not.toHaveBeenCalled();
    expect(screen.getByText(/Full name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Email address is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
  });

  test('4. Validates minimum password length of 8 characters', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/^Email$/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const submitBtn = screen.getByRole('button', { name: /Create account/i });

    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    fireEvent.change(emailInput, { target: { value: 'alice@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.click(submitBtn);

    expect(mockRegister).not.toHaveBeenCalled();
    expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
  });

  test('5. Shows loading state during registration submission', async () => {
    let resolveRegister;
    mockRegister.mockImplementation(() => new Promise((resolve) => { resolveRegister = resolve; }));

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/^Email$/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const submitBtn = screen.getByRole('button', { name: /Create account/i });

    fireEvent.change(nameInput, { target: { value: 'Alice Johnson' } });
    fireEvent.change(emailInput, { target: { value: 'alice@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'securePass123' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Signing in\.\.\.|Creating account\.\.\./i)).toBeInTheDocument();
    expect(mockRegister).toHaveBeenCalledWith('Alice Johnson', 'alice@example.com', 'securePass123');

    await act(async () => {
      resolveRegister({ success: true });
    });
  });
});
