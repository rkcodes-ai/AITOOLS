import express from 'express';
import {
  generateImage,
  summarize,
  translate,
  getAIConfig,
} from '../controllers/aiController.js';
import { optionalAuthenticateUser } from '../middleware/authentication.js';

const router = express.Router();

// Configuration endpoint (supported models, languages, and provider status)
router.get('/config', getAIConfig);

// AI Image Generation Endpoint (attaches to user history if authenticated)
router.post('/image', optionalAuthenticateUser, generateImage);

// AI Text / Article Summarization Endpoint (attaches to user history if authenticated)
router.post('/summarize', optionalAuthenticateUser, summarize);

// AI Text Translation Endpoint (attaches to user history if authenticated)
router.post('/translate', optionalAuthenticateUser, translate);

export default router;
