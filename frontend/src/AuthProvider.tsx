import React, { createContext, useState, useMemo, useCallback } from 'react';
import { User, AuthContextType } from './types/authTypes';

// Create the context with a default value
const defaultContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  token: null,
  login: () => {},
  logout: () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('authToken');
  });

  console.log('AuthProvider rendering', { hasUser: !!user, isAuthenticated, hasToken: !!token });

  const login = useCallback((userId: number, username: string, roles: string[], authToken: string) => {
    console.log('Auth login called:', { userId, username, roles, authToken });
    setUser({ id: userId, username, roles });
    setToken(authToken);
    setIsAuthenticated(true);
    localStorage.setItem('authToken', authToken);
  }, []);

  const logout = useCallback(() => {
    console.log('Auth logout called');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    token,
    login,
    logout
  }), [user, isAuthenticated, token, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};