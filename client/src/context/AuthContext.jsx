import { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { setAccessToken, clearAuth, setOnAuthFailure } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Register the auth failure callback so expired sessions redirect to login
  useEffect(() => {
    setOnAuthFailure(() => {
      setUser(null);
    });
    return () => setOnAuthFailure(null);
  }, []);

  const initAuth = useCallback(async () => {
    try {
      const { data } = await authService.refresh();
      setAccessToken(data.data.accessToken);
      setUser(data.data.user);
    } catch {
      clearAuth();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (credentials) => {
    const { data } = await authService.login(credentials);
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      clearAuth();
      setUser(null);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
