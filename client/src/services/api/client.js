import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 60000, // 60s timeout for AI generation tasks
});

// Response interceptor for consistent error extraction and session error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response?.data;
    const message =
      errorData?.error?.message ||
      errorData?.message ||
      error.message ||
      'An unexpected network error occurred.';

    const enhancedError = new Error(message);
    enhancedError.status = error.response?.status;
    enhancedError.code = errorData?.error?.code || 'NETWORK_ERROR';
    enhancedError.retryable = errorData?.error?.retryable || false;

    // Clean up any legacy token if 401
    if (enhancedError.status === 401) {
      localStorage.removeItem('aitools_token');
    }

    return Promise.reject(enhancedError);
  }
);
