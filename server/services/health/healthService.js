import { getDBStatus } from '../../config/database.js';
import { config, getConfigurationSummary } from '../../config/env.js';

export const getSystemHealth = () => {
  const dbStatus = getDBStatus();
  const configSummary = getConfigurationSummary();

  const isDegraded = !dbStatus.connected;

  return {
    status: isDegraded ? 'degraded' : 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    configuration: configSummary,
    security: {
      headersActive: true,
      rateLimitingActive: true,
      ssrfProtectionActive: true,
      corsWhitelist: config.cors.allowedOrigins,
    },
    services: {
      imageGeneration: true,
      summarization: true,
      translation: true,
      communityPosts: dbStatus.connected,
    },
  };
};
