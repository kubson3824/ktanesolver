import { useEffect } from 'react';
import { create } from 'zustand';

type Theme = 'manual' | 'manual-dark';

export const STORAGE_KEY = 'ktane-theme';

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'manual-dark' ? 'manual-dark' : 'manual';
  } catch {
    return 'manual';
  }
}

interface ThemeStore {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const initialTheme = getInitialTheme();
export const useThemeStore = create<ThemeStore>((set) => ({
  theme: initialTheme,
  isDark: initialTheme === 'manual-dark',
  toggleTheme: () =>
    set((state) => {
      const next: Theme = state.theme === 'manual' ? 'manual-dark' : 'manual';
      document.documentElement.setAttribute('data-theme', next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore storage errors
      }
      return { theme: next, isDark: next === 'manual-dark' };
    }),
}));

export function useTheme() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  // Sync data-theme on initial mount and re-read localStorage in case the store
  // was initialized before this render (e.g., in test environments where localStorage
  // is set after module import but before component render).
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const localTheme: Theme = stored === 'manual-dark' ? 'manual-dark' : 'manual';
      if (useThemeStore.getState().theme !== localTheme) {
        useThemeStore.setState({ theme: localTheme, isDark: localTheme === 'manual-dark' });
      }
      document.documentElement.setAttribute('data-theme', localTheme);
    } catch {
      document.documentElement.setAttribute('data-theme', useThemeStore.getState().theme);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { theme, isDark, toggleTheme };
}
