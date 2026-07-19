export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'vatrio_theme_preference';

export function getPreferredTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    if (saved && ['light', 'dark', 'system'].includes(saved)) return saved;
    return 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(mode: ThemeMode): 'light' | 'dark' {
  const root = document.documentElement;
  let effectiveTheme: 'light' | 'dark' = 'light';

  if (mode === 'system') {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    effectiveTheme = prefersDark ? 'dark' : 'light';
  } else {
    effectiveTheme = mode;
  }

  root.setAttribute('data-theme', effectiveTheme);
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    // Ignore storage restrictions
  }
  return effectiveTheme;
}
