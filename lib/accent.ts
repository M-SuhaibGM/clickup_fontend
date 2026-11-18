import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export const ACCENTS = [
  { id: 'black', label: 'Black', color: '#2a2b2e' },
  { id: 'purple', label: 'Purple', color: '#7b68ee' },
  { id: 'blue', label: 'Blue', color: '#1090e0' },
  { id: 'pink', label: 'Pink', color: '#ff4081' },
  { id: 'violet', label: 'Violet', color: '#b05ae0' },
  { id: 'indigo', label: 'Indigo', color: '#5f7cff' },
  { id: 'orange', label: 'Orange', color: '#e8741a' },
  { id: 'teal', label: 'Teal', color: '#12a4a4' },
  { id: 'bronze', label: 'Bronze', color: '#a8837a' },
  { id: 'mint', label: 'Mint', color: '#3dbf94' },
];

export const STORAGE_KEY = 'accent-theme';
export const MODE_KEY = 'appearance-mode';
export type Mode = 'light' | 'dark' | 'custom';

export function readMode(): Mode {
  try {
    const m = localStorage.getItem(MODE_KEY);
    if (m === 'light' || m === 'dark' || m === 'custom') return m;
  } catch {}
  return 'dark';
}

export function applyAccent(id: string) {
  const el = document.documentElement;
  if (id === 'black') el.removeAttribute('data-accent');
  else el.setAttribute('data-accent', id);
}

/** Restore the saved accent on app load. */
export function useAccentInit() {
  const { setTheme } = useTheme();
  useEffect(() => {
    try {
      const m = readMode();
      setTheme(m === 'light' ? 'light' : 'dark');
      applyAccent(m === 'custom' ? localStorage.getItem(STORAGE_KEY) || 'black' : 'black');
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
