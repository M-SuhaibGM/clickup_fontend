'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EyeOff, GripVertical, Maximize2, MoreHorizontal, Minimize2, RefreshCw } from 'lucide-react';

interface Props {
  id: string;
  title: string;
  count?: number;
  wide: boolean;
  onToggleWide: () => void;
  onHide: () => void;
  onRefresh?: () => void;
  children: ReactNode;
}

/** A draggable dashboard card: grip to reorder, expand to full width, menu to refresh or hide. */
export default function MyCard({ id, title, count, wide, onToggleWide, onHide, onRefresh, children }: Props) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const item = 'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] text-[color:var(--c-white)] hover:bg-[color:var(--c-333438)]';

  return (
    <section
      id={`card-${id}`}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className={`group/card flex min-h-0 scroll-mt-4 flex-col rounded-2xl border border-[color:var(--mt-border)] bg-[color:var(--mt-card)] ${wide ? 'md:col-span-2 h-[560px]' : 'h-[420px]'}`}
    >
      <header className="flex shrink-0 items-center gap-1.5 px-3 pb-2 pt-3">
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Move ${title}`}
          title="Drag to reorder"
          style={{ touchAction: 'none' }}
          className="cursor-grab rounded p-0.5 text-[color:var(--c-8a8c91)] opacity-0 transition hover:text-[color:var(--c-white)] focus-visible:opacity-100 group-hover/card:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <h2 className="truncate text-[15px] font-semibold text-[color:var(--c-white)]">{title}</h2>
        {count !== undefined && <span className="rounded-full bg-[color:var(--c-2a2b2e)] px-1.5 text-[11.5px] font-medium text-[color:var(--c-8a8c91)]">{count}</span>}

        <div className="ml-auto flex items-center gap-0.5 opacity-0 transition focus-within:opacity-100 group-hover/card:opacity-100">
          <button onClick={onToggleWide} aria-label={wide ? 'Make card narrower' : 'Make card wider'} title={wide ? 'Collapse' : 'Expand'} className="rounded p-1 text-[color:var(--c-8a8c91)] hover:bg-[color:var(--c-2a2b2e)] hover:text-[color:var(--c-white)]">
            {wide ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenu((v) => !v)} aria-label="Card options" aria-expanded={menu} className="rounded p-1 text-[color:var(--c-8a8c91)] hover:bg-[color:var(--c-2a2b2e)] hover:text-[color:var(--c-white)]">
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menu && (
              <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-lg border border-[color:var(--mt-border)] bg-[color:var(--c-2a2b2e)] p-1 shadow-2xl">
                {onRefresh && <button onClick={() => { setMenu(false); onRefresh(); }} className={item}><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>}
                <button onClick={() => { setMenu(false); onToggleWide(); }} className={item}>{wide ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}{wide ? 'Collapse' : 'Expand'}</button>
                <button onClick={() => { setMenu(false); onHide(); }} className={item}><EyeOff className="h-3.5 w-3.5" /> Hide card</button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  );
}

