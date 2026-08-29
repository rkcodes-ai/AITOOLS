import {
  registerUserService,
  loginUserService,
  getProfileService,
  changePasswordService,
} from '../services/auth/authService.js';
import {
  validateRegisterInput,
  validateLoginInput,
  validateChangePasswordInput,
} from '../validators/authValidators.js';
import { config } from '../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.server.isProd,
  sameSite: config.server.isProd ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export const register = async (req, res, next) => {
  try {
    const validated = validateRegisterInput(req.body);
    const result = await registerUserService(validated);

    // Set refresh session cookie
    res.cookie(config.auth.cookieName, result.accessToken, COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const validated = validateLoginInput(req.body);
    const result = await loginUserService(validated);

    // Set refresh session cookie
    res.cookie(config.auth.cookieName, result.accessToken, COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.clearCookie(config.auth.cookieName, {
    httpOnly: true,
    secure: config.server.isProd,
    sameSite: config.server.isProd ? 'strict' : 'lax',
    path: '/',
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

export const getMe = async (req, res, next) => {
  try {
    const profile = await getProfileService(req.user.id);
    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const validated = validateChangePasswordInput(req.body);
    const result = await changePasswordService(req.user.id, validated);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
