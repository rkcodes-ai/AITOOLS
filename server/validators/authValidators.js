import { ValidationError } from '../utils/errors.js';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const validateRegisterInput = ({ name, email, password }) => {
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    throw new ValidationError('Name is required and must be at least 2 characters.', 'INVALID_NAME');
  }
  if (name.trim().length > 100) {
    throw new ValidationError('Name cannot exceed 100 characters.', 'NAME_TOO_LONG');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    throw new ValidationError('A valid email address is required.', 'INVALID_EMAIL');
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new ValidationError('Password is required and must be at least 8 characters long.', 'WEAK_PASSWORD');
  }

  if (password.length > 128) {
    throw new ValidationError('Password cannot exceed 128 characters.', 'PASSWORD_TOO_LONG');
  }

  return {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
  };
};

export const validateLoginInput = ({ email, password }) => {
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    throw new ValidationError('A valid email address is required.', 'INVALID_EMAIL');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    throw new ValidationError('Password is required.', 'EMPTY_PASSWORD');
  }

  return {
    email: email.toLowerCase().trim(),
    password,
  };
};

export const validateChangePasswordInput = ({ currentPassword, newPassword }) => {
  if (!currentPassword || typeof currentPassword !== 'string') {
    throw new ValidationError('Current password is required.', 'EMPTY_CURRENT_PASSWORD');
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new ValidationError('New password must be at least 8 characters long.', 'WEAK_PASSWORD');
  }

  if (newPassword.length > 128) {
    throw new ValidationError('New password cannot exceed 128 characters.', 'PASSWORD_TOO_LONG');
  }

  return {
    currentPassword,
    newPassword,
  };
};
