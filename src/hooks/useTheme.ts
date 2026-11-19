import { useEffect } from 'react';
import { create } from 'zustand';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'personal-kanban-theme';

function getSavedTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch {
    // Ignore localStorage access errors
  }
  return 'system';
}

function applyThemeClass(mode: ThemeMode) {
  if (typeof window === 'undefined') return;
  const root = window.document.documentElement;
  const isDark =
    mode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : mode === 'dark';
  root.classList.toggle('dark', isDark);
}

interface ThemeStoreState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const useThemeStore = create<ThemeStoreState>((set) => ({
  theme: getSavedTheme(),
  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore localStorage write errors
    }
    applyThemeClass(theme);
    set({ theme });
  },
}));

/**
 * Synchronizes theme class and system color-scheme listener once at the app root.
 */
export const useThemeSync = () => {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    applyThemeClass(theme);
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => applyThemeClass('system');
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);
};

export const useTheme = () => {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  return { theme, setTheme };
};
