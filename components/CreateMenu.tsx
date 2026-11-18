'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleCheck, FolderKanban, Hash, ListChecks, Orbit, Plus, Send, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateModal } from '@/store/createModalStore';
import { lazyOnOpen } from './LazyMount';

const NewListModal = lazyOnOpen(() => import('./NewListModal'));
const NewMessageModal = lazyOnOpen(() => import('./NewMessageModal'));


interface Item {
  id: string;
  label: string;
  desc?: string;
  icon: LucideIcon;
  shortcut?: string;
  adminOnly?: boolean;
  run: () => void;
}

interface Props {
  isAdmin: boolean;
  onCreateSpace: () => void;
  onCreateProject: () => void;
}

const MENU_WIDTH = 320;

/** The sidebar "Create" button: opens a menu first; the chosen item then opens its own dialog. */
export default function CreateMenu({ isAdmin, onCreateSpace, onCreateProject }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const [listOpen, setListOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    setQuery('');
    setActive(0);
  };

  const items = useMemo<{ section: string | null; items: Item[] }[]>(
    () => [
      {
        section: 'Create',
        items: [
          // { id: 'task', label: 'Task', icon: CircleCheck, shortcut: 'Alt T', run: () => useCreateModal.getState().openModal('task') },
          { id: 'message', label: 'Message', icon: Send, shortcut: 'Ctrl G', run: () => setMessageOpen(true) },
        ],
      },
      {
        section: null,
        items: [
          { id: 'list', label: 'List', desc: 'Track tasks inside a project', icon: ListChecks, adminOnly: true, run: () => setListOpen(true) },
          { id: 'project', label: 'Project', desc: 'Group lists and a channel inside a space', icon: FolderKanban, adminOnly: true, run: onCreateProject },
          { id: 'channel', label: 'Channel', desc: 'Every project comes with its own channel', icon: Hash, adminOnly: true, run: onCreateProject },
          { id: 'space', label: 'Space', desc: 'Organize work by team or department', icon: Orbit, adminOnly: true, run: onCreateSpace },
        ],
      },
    ],
    [onCreateProject, onCreateSpace]
  );

  // Filtered view; `flat` drives keyboard navigation
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .map((g) => ({ ...g, items: g.items.filter((i) => !q || `${i.label} ${i.desc ?? ''}`.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [items, query]);
  const flat = useMemo(() => visible.flatMap((g) => g.items), [visible]);

  const choose = (item: Item) => {
    if (item.adminOnly && !isAdmin) {
      toast.error('Only workspace admins can create this');
      return;
    }
    close();
    item.run();
  };

  const toggle = () => {
    if (open) return close();
    const r = buttonRef.current?.getBoundingClientRect();
    if (r) setPos({ left: Math.max(8, Math.min(r.left, window.innerWidth - MENU_WIDTH - 8)), top: r.bottom + 8 });
    setOpen(true);
  };

  // Outside click + Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !buttonRef.current?.contains(t)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Global shortcuts shown in the menu
  const runTask = () => useCreateModal.getState().openModal('task');
  const shortcutRef = useRef({ runTask, openMessage: () => setMessageOpen(true) });
  useEffect(() => {
    shortcutRef.current = { runTask, openMessage: () => setMessageOpen(true) };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyT') {
        e.preventDefault();
        shortcutRef.current.runTask();
      } else if (e.ctrlKey && !e.altKey && !e.metaKey && e.code === 'KeyG') {
        e.preventDefault();
        shortcutRef.current.openMessage();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 px-3 py-1 bg-[color:var(--c-white)] hover:opacity-85 text-[color:var(--c-1e1f21)] rounded-md text-[13px] font-semibold transition"
      >
        <Plus className="h-3.5 w-3.5" /> Create
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ left: pos.left, top: pos.top, width: MENU_WIDTH }}
            className="fixed z-50 rounded-xl border border-[color:var(--c-333438)] bg-[color:var(--c-232426)] p-2 shadow-2xl"
          >
            <input
              autoFocus
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, flat.length - 1)); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
                else if (e.key === 'Enter' && flat[active]) { e.preventDefault(); choose(flat[active]); }
              }}
              placeholder="Describe anything to create"
              className="w-full rounded-lg border border-[color:var(--c-white)]/70 bg-transparent px-3 py-2 text-[14px] text-[color:var(--c-white)] placeholder:text-[color:var(--c-8a8c91)] outline-none"
            />

            <div className="mt-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {visible.map((group, gi) => (
                <div key={group.section ?? `g${gi}`} className={gi > 0 ? 'mt-1 border-t border-[color:var(--c-333438)] pt-1' : ''}>
                  {group.section && (
                    <p className="px-2.5 pt-3 pb-1 text-[12.5px] font-semibold text-[color:var(--c-8a8c91)]">{group.section}</p>
                  )}
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const idx = flat.indexOf(item);
                    const locked = item.adminOnly && !isAdmin;
                    return (
                      <button
                        key={item.id}
                        role="menuitem"
                        onClick={() => choose(item)}
                        onMouseEnter={() => setActive(idx)}
                        title={locked ? 'Only workspace admins can create this' : undefined}
                        className={`w-full flex items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                          idx === active ? 'bg-[color:var(--c-2a2b2e)]' : ''
                        } ${locked ? 'opacity-50' : ''}`}
                      >
                        <Icon className="h-4 w-4 mt-0.5 shrink-0 text-[color:var(--c-e5e5e5)]" />
                        <span className="flex-1 min-w-0">
                          <span className="block text-[14px] text-[color:var(--c-white)]">{item.label}</span>
                          {item.desc && <span className="block text-[12.5px] text-[color:var(--c-8a8c91)]">{item.desc}</span>}
                        </span>
                        {item.shortcut && <span className="text-[12px] text-[color:var(--c-8a8c91)] mt-0.5">{item.shortcut}</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
              {flat.length === 0 && (
                <p className="px-3 py-6 text-center text-[13px] text-[color:var(--c-8a8c91)]">Nothing matches &quot;{query}&quot;</p>
              )}
            </div>
          </div>,
          document.body
        )}

      <NewListModal open={listOpen} onClose={() => setListOpen(false)} />
      <NewMessageModal open={messageOpen} onClose={() => setMessageOpen(false)} />
    </>
  );
}
