import { createContext, useContext, useState, useEffect } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  setTheme: (t: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'dark',
  systemTheme: 'dark',
  setTheme: () => {},
});

function getSystemTheme(): ResolvedTheme {
  try { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  catch { return 'dark'; }
}

function getSavedPreference(): ThemePreference {
  try { return (localStorage.getItem('theme-preference') as ThemePreference) || 'system'; }
  catch { return 'system'; }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(getSavedPreference);
  const [systemDark, setSystemDark] = useState(() => getSystemTheme() === 'dark');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const systemTheme: ResolvedTheme = systemDark ? 'dark' : 'light';
  const resolvedTheme: ResolvedTheme = preference === 'system' ? systemTheme : preference;

  const setTheme = (t: ThemePreference) => {
    setPreference(t);
    try { localStorage.setItem('theme-preference', t); } catch {}
  };

  return (
    <ThemeContext.Provider value={{ theme: preference, resolvedTheme, systemTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Applique le thème utilisateur sur <html> — à rendre dans le layout privé */
export function PrivateThemeApplier() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [resolvedTheme]);
  return null;
}

/** Applique le thème système sur <html> — à rendre dans les pages publiques */
export function PublicThemeApplier() {
  const { systemTheme } = useTheme();
  useEffect(() => {
    const root = document.documentElement;
    if (systemTheme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [systemTheme]);
  return null;
}
