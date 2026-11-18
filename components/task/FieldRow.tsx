'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/** One "icon  Label   value" row of the task's field grid. */
export function FieldRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-9 items-center gap-3">
      <span className="flex w-28 shrink-0 items-center gap-2 text-[13px] text-[color:var(--c-8a8c91)]">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** Calls onClose when the user clicks outside the returned ref's element or presses Escape. */
export function useDismiss<T extends HTMLElement>(active: boolean, onClose: () => void) {
  const ref = useRef<T>(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; });
  useEffect(() => {
    if (!active) return;
    const onDown = (e: MouseEvent) => {
      const el = e.target as Element;
      if (ref.current?.contains(el)) return;
      if (el.closest?.('[data-popover-trigger]')) return; // the trigger toggles the popover itself
      close.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation(); // don't also close the whole modal
        close.current();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [active]);
  return ref;
}

export const popoverCls =
  'absolute left-0 top-full z-30 mt-1 rounded-lg border border-[color:var(--c-333438)] bg-[color:var(--c-2a2b2e)] shadow-2xl';
export const valueBtn =
  'flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] text-[color:var(--c-8a8c91)] transition hover:bg-[color:var(--c-2a2b2e)] hover:text-[color:var(--c-white)]';
