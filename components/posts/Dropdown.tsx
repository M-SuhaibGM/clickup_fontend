'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
  /** The always-visible button content */
  trigger: ReactNode;
  triggerClassName?: string;
  /** Menu content; call `close()` after a selection */
  children: (close: () => void) => ReactNode;
  align?: 'left' | 'right';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  menuClassName?: string;
  disabled?: boolean;
}

/** Minimal popover menu: closes on outside click and Escape. Works controlled or uncontrolled. */
export default function Dropdown({
  trigger, triggerClassName = '', children, align = 'left', open, onOpenChange, menuClassName = '', disabled,
}: Props) {
  const [innerOpen, setInnerOpen] = useState(false);
  const isOpen = open ?? innerOpen;
  const setOpen = (v: boolean) => (onOpenChange ? onOpenChange(v) : setInnerOpen(v));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (onOpenChange) onOpenChange(false);
        else setInnerOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (onOpenChange) onOpenChange(false);
      else setInnerOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onOpenChange]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setOpen(!isOpen)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {isOpen && (
        <div
          role="listbox"
          className={`absolute z-30 mt-1.5 min-w-[220px] max-h-72 overflow-y-auto rounded-xl border border-[color:var(--c-333438)] bg-[color:var(--c-232426)] p-1 shadow-2xl custom-scrollbar ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${menuClassName}`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  active, onClick, children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={!!active}
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-[13.5px] transition-colors ${
        active
          ? 'bg-(--c-2a2b2e) text-(--c-white)'
          : 'text-[color:var(--c-e5e5e5)] hover:bg-[color:var(--c-2a2b2e)]'
      }`}
    >
      {children}
    </button>
  );
}
