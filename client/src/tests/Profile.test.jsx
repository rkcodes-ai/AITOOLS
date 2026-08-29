import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { Profile } from '../pages/Profile.jsx';

// Mock auth api & generations api
const mockChangePasswordApi = jest.fn();
const mockGetGenerationsApi = jest.fn().mockResolvedValue({ success: true, data: [] });

jest.mock('../services/api/auth.js', () => ({
  changePasswordApi: (...args) => mockChangePasswordApi(...args),
}));

jest.mock('../services/api/generations.js', () => ({
  getGenerationsApi: (...args) => mockGetGenerationsApi(...args),
}));

const mockUser = {
  name: 'Elena Rostova',
  email: 'elena@aitools.io',
  role: 'Architect',
};

jest.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
  }),
}));

describe('AITOOLS Settings / Profile Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetGenerationsApi.mockResolvedValue({ success: true, data: [] });
    mockChangePasswordApi.mockResolvedValue({ success: true, message: 'Password updated successfully.' });
  });

  test('1. Renders authenticated user real profile information (name, email, role)', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Elena Rostova')).toBeInTheDocument();
    expect(screen.getByText('elena@aitools.io')).toBeInTheDocument();
    expect(screen.getByText('Architect')).toBeInTheDocument();
  });

  test('2. Password fields start completely empty with correct placeholders', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );
    });

    const currentPasswordInput = screen.getByPlaceholderText('Enter current password');
    const newPasswordInput = screen.getByPlaceholderText('Enter new password');

    expect(currentPasswordInput.value).toBe('');
    expect(newPasswordInput.value).toBe('');
    expect(currentPasswordInput.type).toBe('password');
    expect(newPasswordInput.type).toBe('password');
  });

  test('3. Password visibility toggle switches input type between password and text', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );
    });

    const currentPasswordInput = screen.getByPlaceholderText('Enter current password');
    const newPasswordInput = screen.getByPlaceholderText('Enter new password');

    const toggleCurrentBtn = screen.getByLabelText('Toggle current password visibility');
    const toggleNewBtn = screen.getByLabelText('Toggle new password visibility');

    // Toggle current
    fireEvent.click(toggleCurrentBtn);
    expect(currentPasswordInput.type).toBe('text');
    fireEvent.click(toggleCurrentBtn);
    expect(currentPasswordInput.type).toBe('password');

    // Toggle new
    fireEvent.click(toggleNewBtn);
    expect(newPasswordInput.type).toBe('text');
    fireEvent.click(toggleNewBtn);
    expect(newPasswordInput.type).toBe('password');
  });

  test('4. Update Password button is disabled when fields are empty or invalid', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );
    });

    const submitBtn = screen.getByRole('button', { name: 'Update Password' });
    expect(submitBtn).toBeDisabled();

    const currentPasswordInput = screen.getByPlaceholderText('Enter current password');
    const newPasswordInput = screen.getByPlaceholderText('Enter new password');

    // Too short new password (< 8 chars)
    fireEvent.change(currentPasswordInput, { target: { value: 'OldPassword1!' } });
    fireEvent.change(newPasswordInput, { target: { value: 'short' } });
    expect(submitBtn).toBeDisabled();
    expect(screen.getByText('Password must be at least 8 characters long.')).toBeInTheDocument();

    // Identical passwords
    fireEvent.change(newPasswordInput, { target: { value: 'OldPassword1!' } });
    expect(submitBtn).toBeDisabled();
    expect(screen.getByText('New password must differ from current password.')).toBeInTheDocument();

    // Valid passwords (>= 8 chars and different)
    fireEvent.change(newPasswordInput, { target: { value: 'NewSecurePassword123!' } });
    expect(submitBtn).not.toBeDisabled();
  });

  test('5. Successful password update submits form and resets password fields', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );
    });

    const currentPasswordInput = screen.getByPlaceholderText('Enter current password');
    const newPasswordInput = screen.getByPlaceholderText('Enter new password');
    const submitBtn = screen.getByRole('button', { name: 'Update Password' });

    fireEvent.change(currentPasswordInput, { target: { value: 'CurrentPassword123!' } });
    fireEvent.change(newPasswordInput, { target: { value: 'NewBrandPassword456!' } });

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(mockChangePasswordApi).toHaveBeenCalledWith({
      currentPassword: 'CurrentPassword123!',
      newPassword: 'NewBrandPassword456!',
    });

    await waitFor(() => {
      expect(currentPasswordInput.value).toBe('');
      expect(newPasswordInput.value).toBe('');
    });
  });

  test('6. Failed password update displays error message from backend', async () => {
    mockChangePasswordApi.mockRejectedValueOnce(new Error('Current password is incorrect.'));

    await act(async () => {
      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );
    });

    const currentPasswordInput = screen.getByPlaceholderText('Enter current password');
    const newPasswordInput = screen.getByPlaceholderText('Enter new password');
    const submitBtn = screen.getByRole('button', { name: 'Update Password' });

    fireEvent.change(currentPasswordInput, { target: { value: 'WrongPassword123!' } });
    fireEvent.change(newPasswordInput, { target: { value: 'NewBrandPassword456!' } });

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Current password is incorrect.')).toBeInTheDocument();
    });
  });

  test('7. Recent generations displays clean empty state when no history exists', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );
    });

    expect(
      screen.getByText('No personal generations recorded yet. Generate images or summarize text to build your history!')
    ).toBeInTheDocument();
  });
});
