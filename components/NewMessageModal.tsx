'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDmStore } from '@/store/dmStore';
import UserAvatar from './UserAvatar';

// The picker only exists while open, so its state starts fresh every time.
export default function NewMessageModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? <MessagePicker onClose={onClose} /> : null;
}

function MessagePicker({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const me = useAuthStore((s) => s.user);
  const members = useDmStore((s) => s.members);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const people = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter((m) => !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
      .sort((a, b) => (a.id === me?.id ? -1 : b.id === me?.id ? 1 : a.name.localeCompare(b.name)));
  }, [members, query, me?.id]);

  const open = (id: string) => {
    onClose();
    router.push(`/messages/${id}`);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center bg-black/50 p-4 pt-[15vh]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New message"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-card shadow-2xl border border-border overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, people.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
              if (e.key === 'Enter' && people[active]) open(people[active].id);
            }}
            placeholder="Message who?"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-1.5">
          {people.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted-foreground">No one found</p>}
          {people.map((m, i) => (
            <button
              key={m.id}
              onClick={() => open(m.id)}
              onMouseEnter={() => setActive(i)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${i === active ? 'bg-accent' : ''}`}
            >
              <UserAvatar name={m.name} src={m.avatar} size={28} />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground truncate">
                  {m.name}{m.id === me?.id && <span className="ml-1.5 font-normal text-muted-foreground">— You</span>}
                </span>
                <span className="block text-xs text-muted-foreground truncate">{m.email}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
