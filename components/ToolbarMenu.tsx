'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';

export const tbBtn = 'flex items-center gap-1.5 px-2 py-1 rounded text-[12px] transition';
export const tbIdle = 'text-[color:var(--c-8a8c91)] hover:bg-[color:var(--c-2a2b2e)] hover:text-[color:var(--c-white)]';
export const tbOn = 'bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25';

/** A toolbar button with a dropdown panel; closes on outside click / Escape. */
export function ToolbarMenu({
  button,
  children,
  align = 'left',
}: {
  button: (open: boolean, toggle: () => void) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      {button(open, () => setOpen((v) => !v))}
      {open && (
        <div
          className={`absolute top-full mt-1 z-30 min-w-[200px] max-h-[320px] overflow-y-auto rounded-lg border border-[color:var(--c-333438)] bg-[color:var(--c-2a2b2e)] p-1 shadow-2xl ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuRow({ active, onClick, children }: { active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12.5px] text-[color:var(--c-white)] hover:bg-[color:var(--c-333438)] transition"
    >
      <span className="flex-1 flex items-center gap-2 min-w-0">{children}</span>
      {active && <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#777]">{children}</p>;
}
