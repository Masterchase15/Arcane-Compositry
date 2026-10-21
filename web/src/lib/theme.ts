/**
 * lib/theme.ts - light / dark theme. The choice is remembered in this browser;
 * with no choice the site follows the device setting.
 */
import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'ac-theme';
const listeners = new Set<() => void>();

function saved(): Theme | null {
  try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : null; } catch { return null; }
}
const media = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
export const currentTheme = (): Theme => saved() ?? (media?.matches ? 'dark' : 'light');

/** Puts the theme on <html> (the .dark class that Tailwind's dark: styles use). */
export function applyTheme() {
  document.documentElement.classList.toggle('dark', currentTheme() === 'dark');
  listeners.forEach((fn) => fn());
}
media?.addEventListener('change', applyTheme);

export function setTheme(theme: Theme) {
  try { localStorage.setItem(KEY, theme); } catch { /* private mode */ }
  applyTheme();
}

export function useTheme() {
  const theme = useSyncExternalStore((fn) => { listeners.add(fn); return () => listeners.delete(fn); }, currentTheme);
  return { theme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') };
}
