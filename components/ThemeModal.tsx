'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Check, X } from 'lucide-react';

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

const STORAGE_KEY = 'accent-theme';
const MODE_KEY = 'appearance-mode';
export type Mode = 'light' | 'dark' | 'custom';

function readMode(): Mode {
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

function Preview({ mode }: { mode: 'light' | 'dark' | 'custom' }) {
  const pane = (dark: boolean) => (
    <div className={`flex-1 flex gap-1.5 p-2 ${dark ? 'bg-[#0f0f10]' : 'bg-white'}`}>
      <div className="flex flex-col gap-1.5">
        <div className={`h-3 w-3 rounded-sm ${dark ? 'bg-white' : 'bg-[color:var(--c-1e1f21)]'}`} />
        <div className={`h-3 w-3 rounded-sm ${dark ? 'bg-[color:var(--c-333438)]' : 'bg-[#e5e5e5]'}`} />
        <div className={`h-3 w-3 rounded-sm ${dark ? 'bg-[color:var(--c-333438)]' : 'bg-[#e5e5e5]'}`} />
      </div>
      <div className="flex-1 flex flex-col gap-1.5 pt-1">
        <div className={`h-1.5 w-8 rounded ${dark ? 'bg-[color:var(--c-444548)]' : 'bg-[#d4d4d4]'}`} />
        <div className={`h-1.5 w-5 rounded ${dark ? 'bg-white' : 'bg-[color:var(--c-1e1f21)]'}`} />
        <div className={`h-1.5 w-10 rounded ${dark ? 'bg-[color:var(--c-444548)]' : 'bg-[#d4d4d4]'}`} />
      </div>
    </div>
  );
  return (
    <div className="flex h-[72px] w-full overflow-hidden rounded-md">
      {mode === 'light' && pane(false)}
      {mode === 'dark' && pane(true)}
      {mode === 'custom' && (
        <div className="flex flex-1 gap-1.5 bg-[#2b2147] p-2">
          <div className="flex flex-col gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-[#7b68ee]" />
            <div className="h-3 w-3 rounded-sm bg-[#3d315f]" />
            <div className="h-3 w-3 rounded-sm bg-[#3d315f]" />
          </div>
          <div className="flex flex-1 flex-col gap-1.5 pt-1">
            <div className="h-1.5 w-8 rounded bg-[#5a4a8a]" />
            <div className="h-1.5 w-5 rounded bg-[#7b68ee]" />
            <div className="h-1.5 w-10 rounded bg-[#5a4a8a]" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ThemeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { setTheme } = useTheme();
  const [accent, setAccent] = useState('black');
  const [mode, setMode] = useState<Mode>('dark');

  useEffect(() => {
    setMode(readMode());
    try {
      setAccent(localStorage.getItem(STORAGE_KEY) || 'black');
    } catch {}
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const customOn = mode === 'custom';
  const pickMode = (m: Mode) => {
    setMode(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {}
    setTheme(m === 'light' ? 'light' : 'dark');
    applyAccent(m === 'custom' ? accent : 'black');
  };
  const pickAccent = (id: string) => {
    if (!customOn) return;
    setAccent(id);
    applyAccent(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {}
  };

  const modes = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'custom', label: 'Custom' },
  ] as const;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-[450px] max-h-[90vh] overflow-y-auto rounded-2xl border border-[color:var(--c-333438)] bg-[color:var(--c-1e1f21)] p-4 text-[#e5e5e5] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--c-2a2b2e)] text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-[17px] font-bold text-[color:var(--c-white)]">Customize</h2>
        <p className="mt-1 text-[13px] text-[color:var(--c-c4c5c8)]">Personalize and organize your ClickUp interface</p>

        {/* Tabs */}
        <div className="mt-4 flex rounded-lg bg-[color:var(--c-2a2b2e)] p-0.5">
          <button className="flex-1 rounded-md bg-[#0f0f10] py-1.5 text-[13px] font-semibold text-[color:var(--c-white)]">
            Themes
          </button>
        </div>

        <p className="mt-4 mb-2 text-[12px] font-semibold text-[color:var(--c-c4c5c8)]">Appearance</p>
        <div className="grid grid-cols-3 gap-2">
          {modes.map((m) => {
            const active = mode === m.id;
            return (
              <button key={m.id} onClick={() => pickMode(m.id)} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-full rounded-lg border-2 p-0 transition ${
                    active ? 'border-white' : 'border-transparent hover:border-[color:var(--c-444548)]'
                  }`}
                >
                  <Preview mode={m.id} />
                </div>
                <span className={`text-[12px] ${active ? 'font-bold text-[color:var(--c-white)]' : 'text-[color:var(--c-8a8c91)]'}`}>{m.label}</span>
              </button>
            );
          })}
        </div>

        <p className="mt-4 mb-2 text-[12px] font-semibold text-[color:var(--c-c4c5c8)]">ClickUp theme</p>
        {!customOn && <p className="-mt-1 mb-2 text-[11px] text-[color:var(--c-8a8c91)]">Select Custom above to unlock color themes.</p>}
        <div className={`grid grid-cols-3 gap-2 transition ${customOn ? '' : 'pointer-events-none opacity-40'}`}>
          {ACCENTS.map((a) => {
            const active = customOn && accent === a.id;
            return (
              <button
                key={a.id}
                disabled={!customOn}
                onClick={() => pickAccent(a.id)}
                className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-[13px] transition ${
                  active
                    ? 'border-white bg-[color:var(--c-232426)] text-[color:var(--c-white)]'
                    : 'border-[color:var(--c-333438)] text-[color:var(--c-c4c5c8)] hover:bg-[color:var(--c-2a2b2e)]'
                }`}
              >
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-full border border-white/20"
                  style={{ backgroundColor: a.color }}
                >
                  {active && <Check className="h-3 w-3 text-[color:var(--c-white)]" />}
                </span>
                {a.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
