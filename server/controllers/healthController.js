import { getSystemHealth } from '../services/health/healthService.js';
import { config } from '../config/env.js';

export const getHealth = (req, res) => {
  const healthData = getSystemHealth();
  const isProd = process.env.NODE_ENV === 'production' || config.server.isProd;

  // In production, database connectivity is required for a healthy readiness probe
  if (isProd && !healthData.database.connected) {
    return res.status(503).json({
      ...healthData,
      status: 'unhealthy',
      message: 'Database connection is required in production mode.',
    });
  }

  const statusCode = healthData.status === 'ok' ? 200 : 200; // Returns 200 in development
  return res.status(statusCode).json(healthData);
};

export const getRootGreeting = (req, res) => {
  return res.status(200).json({
    message: 'AITOOLS Decoupled Backend API Server is running.',
    version: '1.3.0',
    architecture: 'Modular Layered Architecture (Controllers -> Services -> Repositories / Storage)',
    endpoints: {
      health: '/api/v1/health',
      posts: '/api/v1/post',
      ai: '/api/v1/ai',
    },
  });
};
