import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  changePassword,
} from '../controllers/authController.js';
import { authenticateUser, authLimiter } from '../middleware/authentication.js';

const router = express.Router();

// Public auth endpoints protected with strict auth rate limiter
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);

// Protected user profile & password endpoints
router.get('/me', authenticateUser, getMe);
router.post('/change-password', authLimiter, authenticateUser, changePassword);

export default router;
