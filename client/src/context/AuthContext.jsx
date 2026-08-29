import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { loginApi, registerApi, logoutApi, getMeApi } from '../services/api/auth.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check current session on application load via secure HttpOnly cookie
  const loadUser = useCallback(async () => {
    try {
      const response = await getMeApi();
      if (response && response.success && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      // 401 or network error indicates no active session
      setUser(null);
    } finally {
      // Clean up any legacy token if it existed in previous versions
      localStorage.removeItem('aitools_token');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    try {
      const response = await loginApi({ email, password });
      if (response && response.success && response.data) {
        const { user: userData } = response.data;
        setUser(userData);
        // Ensure no credential leaks to localStorage
        localStorage.removeItem('aitools_token');
        toast.success(`Welcome back, ${userData.name}!`);
        return { success: true };
      }
    } catch (error) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await registerApi({ name, email, password });
      if (response && response.success && response.data) {
        const { user: userData } = response.data;
        setUser(userData);
        // Ensure no credential leaks to localStorage
        localStorage.removeItem('aitools_token');
        toast.success(`Account created successfully. Welcome, ${userData.name}!`);
        return { success: true };
      }
    } catch (error) {
      toast.error(error.message || 'Registration failed. Please try again.');
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('aitools_token');
      setUser(null);
      toast.success('Logged out successfully.');
    }
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    logout,
    refreshUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
