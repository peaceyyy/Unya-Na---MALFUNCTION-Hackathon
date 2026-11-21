import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'flashlight',
  isFlashlight: true,
  origin: null,
  toggleTheme: () => {},
  setTheme: () => {},
  isLocked: false,
  setThemeLocked: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('unproductive_theme');
      return saved === 'light' ? 'light' : 'flashlight';
    } catch {
      return 'flashlight';
    }
  });

  const [origin, setOrigin] = useState(null);
  // Locked during a power cut: the switch cannot change the theme until power returns.
  const [locked, setThemeLocked] = useState(false);
  const isFlashlight = theme === 'flashlight';

  const toggleTheme = (coords) => {
    if (locked) return;
    if (coords && typeof coords.x === 'number' && typeof coords.y === 'number') {
      setOrigin(coords);
    }
    setTheme((prev) => (prev === 'light' ? 'flashlight' : 'light'));
  };

  useEffect(() => {
    if (locked) return; // a blackout is temporary, so it should not overwrite the saved choice
    try {
      localStorage.setItem('unproductive_theme', theme);
    } catch {
      // Ignore localStorage errors
    }
  }, [theme, locked]);

  return (
    <ThemeContext.Provider value={{ theme, isFlashlight, origin, toggleTheme, setTheme, isLocked: locked, setThemeLocked }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
