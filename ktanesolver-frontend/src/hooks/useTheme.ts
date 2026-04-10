import { useState, useEffect } from 'react';

type Theme = 'manual' | 'manual-dark';

const STORAGE_KEY = 'ktane-theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'manual-dark' ? 'manual-dark' : 'manual';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t => (t === 'manual' ? 'manual-dark' : 'manual'));
  };

  return { theme, toggleTheme };
}
