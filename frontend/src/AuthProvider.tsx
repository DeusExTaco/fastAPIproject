
import React, { createContext, useState } from 'react';
import { User, AuthContextType } from './AuthTypes';

// Create the context with a default value
const defaultContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  token: null,
  login: () => {},
  logout: () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('authToken');
  });

  console.log('AuthProvider rendering', { hasUser: !!user, isAuthenticated, hasToken: !!token });

  const login = (userId: number, username: string, roles: string[], authToken: string) => {
    console.log('Auth login called:', { userId, username, roles, authToken });
    setUser({ id: userId, username, roles });
    setToken(authToken);
    setIsAuthenticated(true);
    localStorage.setItem('authToken', authToken);
  };

  const logout = () => {
    console.log('Auth logout called');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        token,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;