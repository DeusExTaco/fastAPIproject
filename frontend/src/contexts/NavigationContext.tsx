// src/contexts/NavigationContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';

interface NavigationContextType {
  isNavExpanded: boolean;
  toggleNav: () => void;
  canExpandNav: boolean;
}

const NavigationContext = createContext<NavigationContextType>({
  isNavExpanded: false,
  toggleNav: () => {},
  canExpandNav: true
});

export const useNavigation = () => useContext(NavigationContext);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [canExpandNav, setCanExpandNav] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Check if screen is smaller than 768x768
      if (width < 768 || height < 768) {
        setIsNavExpanded(false);
        setCanExpandNav(false);
      } else {
        setCanExpandNav(true);
        setIsNavExpanded(true); // Expand by default on larger screens
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleNav = () => {
    if (canExpandNav) {
      setIsNavExpanded(prev => !prev);
    }
  };

  return (
    <NavigationContext.Provider value={{ isNavExpanded, toggleNav, canExpandNav }}>
      {children}
    </NavigationContext.Provider>
  );
};