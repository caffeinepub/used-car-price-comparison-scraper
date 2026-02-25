import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useInternetIdentity } from './useInternetIdentity';
import { useUserPreferences, useSaveUserPreferences } from './useQueries';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeState(): ThemeContextValue {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: backendPrefs, isFetched: prefsFetched } = useUserPreferences();
  const saveUserPrefs = useSaveUserPreferences();

  const hydratedFromBackend = useRef(false);

  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('app_theme');
    return stored === 'light' || stored === 'dark' ? stored : 'dark';
  });

  // Apply theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  // Hydrate from backend when authenticated and preferences are loaded
  useEffect(() => {
    if (!isAuthenticated || !prefsFetched || hydratedFromBackend.current) return;

    hydratedFromBackend.current = true;

    if (backendPrefs && (backendPrefs.theme === 'light' || backendPrefs.theme === 'dark')) {
      setTheme(backendPrefs.theme as Theme);
    }
  }, [isAuthenticated, prefsFetched, backendPrefs]);

  // Reset hydration flag when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      hydratedFromBackend.current = false;
    }
  }, [isAuthenticated]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';

      if (isAuthenticated && hydratedFromBackend.current) {
        // Read current column prefs from localStorage to save alongside theme
        const columnPrefsJson = localStorage.getItem('dashboard_column_prefs') ?? '{}';
        saveUserPrefs.mutate({ columnPrefsJson, theme: next });
      }

      return next;
    });
  };

  return { theme, toggleTheme };
}

export { ThemeContext };
