import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('inaquired_theme') as Theme | null;
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
      const fallback = localStorage.getItem('theme') as Theme | null;
      if (fallback === 'light' || fallback === 'dark') {
        return fallback;
      }
      try {
        const cookieMatch = document.cookie.match(/inaquired_theme=([^;]+)/);
        if (cookieMatch && (cookieMatch[1] === 'light' || cookieMatch[1] === 'dark')) {
          return cookieMatch[1] as Theme;
        }
      } catch (e) {}
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  const applyThemeToDOM = (t: Theme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    if (t === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
      if (body) {
        body.classList.add('dark');
        body.setAttribute('data-theme', 'dark');
      }
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
      if (body) {
        body.classList.remove('dark');
        body.setAttribute('data-theme', 'light');
      }
    }
  };

  const persistTheme = (t: Theme) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('inaquired_theme', t);
      localStorage.setItem('theme', t);
      document.cookie = `inaquired_theme=${t};path=/;max-age=31536000;SameSite=Lax`;
    } catch (e) {
      console.warn('Failed to persist theme:', e);
    }
  };

  useEffect(() => {
    applyThemeToDOM(theme);
    persistTheme(theme);
  }, [theme]);

  // Sync theme changes across browser tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'inaquired_theme' || e.key === 'theme') {
        const val = e.newValue as Theme | null;
        if (val === 'light' || val === 'dark') {
          setThemeState(val);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleTheme = () => {
    setThemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      applyThemeToDOM(next);
      persistTheme(next);
      return next;
    });
  };

  const setTheme = (newTheme: Theme) => {
    applyThemeToDOM(newTheme);
    persistTheme(newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
