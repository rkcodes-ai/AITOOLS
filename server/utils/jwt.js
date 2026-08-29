import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const generateAccessToken = (user) => {
  const payload = {
    sub: String(user._id || user.id),
    name: user.name,
    email: user.email,
    role: user.role || 'user',
  };

  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
    issuer: 'aitools-api',
  });
};

export const generateRefreshToken = (user) => {
  const payload = {
    sub: String(user._id || user.id),
    type: 'refresh',
  };

  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.refreshExpiresIn,
    issuer: 'aitools-api',
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.auth.jwtSecret, {
      issuer: 'aitools-api',
    });
  } catch (error) {
    return null;
  }
};
