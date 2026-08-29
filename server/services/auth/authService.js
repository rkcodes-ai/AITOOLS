import bcrypt from 'bcryptjs';
import { userRepository } from '../../repositories/userRepository.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt.js';
import { AppError } from '../../utils/errors.js';

export const registerUserService = async ({ name, email, password }) => {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new AppError('An account with this email address already exists.', 409, 'EMAIL_ALREADY_EXISTS');
  }

  const user = await userRepository.create({
    name,
    email,
    password,
    role: 'user',
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: user.toSafeObject(),
    accessToken,
    refreshToken,
  };
};

export const loginUserService = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  if (user.status === 'suspended') {
    throw new AppError('Your account is currently suspended. Please contact support.', 403, 'ACCOUNT_SUSPENDED');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: user.toSafeObject(),
    accessToken,
    refreshToken,
  };
};

export const getProfileService = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User profile not found.', 404, 'USER_NOT_FOUND');
  }

  return user.toSafeObject();
};

export const changePasswordService = async (userId, { currentPassword, newPassword }) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect.', 401, 'INVALID_CURRENT_PASSWORD');
  }

  const salt = await bcrypt.genSalt(12);
  const newHashedPassword = await bcrypt.hash(newPassword, salt);

  await userRepository.updatePassword(userId, newHashedPassword);

  return {
    message: 'Password changed successfully.',
  };
};
