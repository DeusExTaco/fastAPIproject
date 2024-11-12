import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

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
  const [isNavExpanded, setIsNavExpanded] = useState(true);
  const [canExpandNav, setCanExpandNav] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      if (width < 640) {
        setIsNavExpanded(false);
        setCanExpandNav(false);
      } else if (width < 1024) {
        setCanExpandNav(true);
        setIsNavExpanded(false);
      } else {
        setCanExpandNav(true);
        setIsNavExpanded(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleNav = useCallback(() => {
    if (canExpandNav) {
      setIsNavExpanded(prev => !prev);
    }
  }, [canExpandNav]);

  const value = useMemo(() => ({
    isNavExpanded,
    toggleNav,
    canExpandNav
  }), [isNavExpanded, toggleNav, canExpandNav]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};