
import { useContext } from 'react';
import { AuthContext } from './AuthProvider';
import { AuthContextType } from './AuthTypes';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('Auth context not available - component tree:', {
      location: new Error().stack
    });
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};