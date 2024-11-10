import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../UseAuth';
import { userPreferencesService } from '../services/userPreferences';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user || !token) {
        setIsLoading(false);
        return;
      }

      try {
        const preferences = await userPreferencesService.getUserPreferences(user.id, token);
        setDarkMode(preferences.dark_mode);
      } catch (error) {
        console.error('Failed to fetch user preferences:', error);
        // Fall back to system preference
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(systemPrefersDark);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPreferences();
  }, [user, token]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = async () => {
    if (!user || !token) return;

    const newDarkMode = !darkMode;
    // Optimistically update UI
    setDarkMode(newDarkMode);

    try {
      // Persist to backend
      await userPreferencesService.updateUserPreferences(user.id, {
        dark_mode: newDarkMode,
      }, token);
    } catch (error) {
      // Revert on failure
      console.error('Failed to update dark mode preference:', error);
      setDarkMode(!newDarkMode);
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};