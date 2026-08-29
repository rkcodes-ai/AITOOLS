import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import os from 'os';
import fileUpload from 'express-fileupload';

import { config } from './config/env.js';
import { connectDB, closeDB } from './config/database.js';
import healthRoutes from './routes/healthRoutes.js';
import postRoutes from './routes/postRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import authRoutes from './routes/authRoutes.js';
import generationRoutes from './routes/generationRoutes.js';
import imagePresetRoutes from './routes/imagePresetRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import knowledgeRoutes from './routes/knowledgeRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestContextMiddleware } from './middleware/requestContext.js';
import {
  helmetMiddleware,
  generalLimiter,
  aiLimiter,
  uploadLimiter,
} from './middleware/security.js';

const app = express();

// 1. Request Context & Correlation ID Tracking
app.use(requestContextMiddleware);

// 2. HTTP Security Headers (Helmet)
app.use(helmetMiddleware);

// 3. CORS Whitelist Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, server-to-server, curl)
      if (!origin || config.cors.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        const error = new Error(`Access blocked by CORS policy: Origin '${origin}' is not authorized.`);
        error.status = 403;
        callback(error);
      }
    },
    credentials: true,
  })
);

// 4. Request Body & Cookie Parsing
app.use(express.json({ limit: config.limits.maxJsonBodyBytes }));
app.use(express.urlencoded({ extended: true, limit: config.limits.maxJsonBodyBytes }));
app.use(cookieParser());

// 5. File Upload Handler with 10MB limit and temp file handling
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: os.tmpdir(),
    limits: { fileSize: config.limits.maxUploadFileSizeBytes },
    abortOnLimit: true,
  })
);

// 6. Rate Limiting Middleware
app.use('/api/v1', generalLimiter);
app.use('/api/v1/ai', aiLimiter);
app.use('/api/v1/post', uploadLimiter);
app.use('/api/v1/documents', uploadLimiter);

// 7. Mount Modular Routes
app.use('/', healthRoutes);
app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/generations', generationRoutes);
app.use('/api/v1/image-presets', imagePresetRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/conversations', conversationRoutes);
app.use('/api/v1/knowledge', knowledgeRoutes);
app.use('/api/v1', postRoutes);
app.use('/api/v1/ai', aiRoutes);

// 8. Centralized Sanitized Error Handler
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(config.server.port, () => {
      console.log(`[Server] AITOOLS backend listening on port ${config.server.port}`);
      console.log(`[Server] Environment: ${config.server.env}`);
      console.log(`[Server] Auth: JWT & cookie-based authentication enabled`);
      console.log(`[Server] Hugging Face: ${config.huggingface.isConfigured ? 'CONFIGURED' : 'NOT CONFIGURED (Public mode)'}`);
      console.log(`[Server] RapidAPI: ${config.rapidapi.isConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
      console.log(`[Server] Cloudinary: ${config.cloudinary.isConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
    });

    const shutdown = async (signal) => {
      console.log(`[Server] Received ${signal}. Initiating graceful shutdown...`);
      server.close(async () => {
        await closeDB();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('[Server] Fatal startup error:', error.message);
    if (config.server.isProd) {
      process.exit(1);
    }
  }
};

startServer();