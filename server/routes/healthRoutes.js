import express from 'express';
import { getHealth, getRootGreeting } from '../controllers/healthController.js';

const router = express.Router();

// Root route
router.get('/', getRootGreeting);

// Health check route
router.get('/health', getHealth);

export default router;
