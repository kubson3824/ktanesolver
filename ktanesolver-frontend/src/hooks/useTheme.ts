import { useEffect } from 'react';
import { create } from 'zustand';

type Theme = 'light' | 'dark';

export const STORAGE_KEY = 'ktane-theme';

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
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
  isDark: initialTheme === 'dark',
  toggleTheme: () =>
    set((state) => {
      const next: Theme = state.theme === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', next === 'dark');
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore storage errors
      }
      return { theme: next, isDark: next === 'dark' };
    }),
}));

export function useTheme() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  // Sync on mount: re-read localStorage in case store was initialised before this render
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const localTheme: Theme = stored === 'dark' ? 'dark' : 'light';
      if (useThemeStore.getState().theme !== localTheme) {
        useThemeStore.setState({ theme: localTheme, isDark: localTheme === 'dark' });
      }
      document.documentElement.classList.toggle('dark', localTheme === 'dark');
    } catch {
      document.documentElement.classList.toggle('dark', useThemeStore.getState().isDark);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { theme, isDark, toggleTheme };
}
