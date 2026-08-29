import mongoose from 'mongoose';
import { ConfigurationError, DatabaseError } from '../utils/errors.js';

let isConnected = false;

/**
 * Robust MongoDB Connection Manager
 * Enforces fail-fast in production while allowing seamless fallback in development.
 */
export const connectDB = async () => {
  const mongoUrl = process.env.MONGODB_URL;
  const isProd = process.env.NODE_ENV === 'production';

  if (!mongoUrl) {
    if (isProd) {
      const err = new ConfigurationError(
        'CRITICAL: MONGODB_URL is mandatory in production environment. Refusing to start in-memory mode.'
      );
      console.error(`[DB] ${err.message}`);
      throw err;
    }
    console.warn('[DB] MONGODB_URL is not defined in environment. Running in development in-memory mode.');
    isConnected = false;
    return false;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 50,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      family: 4,
      retryWrites: true,
    });
    isConnected = true;
    console.log('[DB] Successfully connected to MongoDB');
    return true;
  } catch (err) {
    isConnected = false;
    console.error('[DB] Failed to connect with MongoDB:', err.message);

    if (isProd) {
      const fatalErr = new DatabaseError(
        `CRITICAL: Failed to connect to production MongoDB (${err.message}). Halting startup.`
      );
      throw fatalErr;
    }
    return false;
  }
};

mongoose.connection.on('connected', () => {
  isConnected = true;
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
});

mongoose.connection.on('error', (err) => {
  console.error('[DB] MongoDB runtime connection error:', err.message);
  isConnected = false;
});

/**
 * Graceful Database Connection Teardown
 */
export const closeDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
      isConnected = false;
      console.log('[DB] MongoDB connection closed gracefully.');
    }
  } catch (err) {
    console.error('[DB] Error closing MongoDB connection:', err.message);
  }
};

/**
 * Returns sanitized database status (safe for health check payloads)
 */
export const getDBStatus = () => {
  const readyState = mongoose.connection.readyState;
  return {
    connected: isConnected && readyState === 1,
    readyState,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
};