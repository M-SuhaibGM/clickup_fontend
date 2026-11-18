'use client';

import { CalendarSearch, ChevronDown, Plus } from 'lucide-react';
import { toast } from 'sonner';
import SidebarHeader from './SidebarHeader';

const PROVIDERS = [
  { name: 'Google Calendar', emoji: '🗓️' },
  { name: 'Microsoft Outlook', emoji: '📧' },
];

export default function PlannerSidebar({ onCollapse }: { onCollapse?: () => void }) {
  return (
    <div className="w-full h-full flex flex-col text-[color:var(--c-e5e5e5)] overflow-hidden">
      <SidebarHeader
        title="Planner"
        onCollapse={onCollapse}
        action={
          <button
            onClick={() => toast.info('Connect a calendar to add events')}
            aria-label="Add"
            className="h-7 px-2 flex items-center gap-0.5 rounded-md bg-[color:var(--c-2a2b2e)] text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] transition"
          >
            <Plus className="h-4 w-4" />
            <ChevronDown className="h-3 w-3" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-3 pt-16 custom-scrollbar">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4 h-14 w-14 rounded-xl bg-[color:var(--c-333438)] flex items-center justify-center">
            <CalendarSearch className="h-8 w-8 text-[color:var(--c-8a8c91)]" />
          </div>
          <p className="text-[13px] text-[color:var(--c-8a8c91)] max-w-[220px] leading-snug">
            Connect your calendar to view upcoming events and join your next call
          </p>
        </div>

        <div className="mt-5 space-y-2">
          {PROVIDERS.map((p) => (
            <div key={p.name} className="flex items-center justify-between rounded-xl border border-[color:var(--c-333438)] px-3 py-2.5">
              <span className="flex items-center gap-2.5 min-w-0">
                <span className="text-base leading-none">{p.emoji}</span>
                <span className="text-[14px] font-medium text-[color:var(--c-white)] truncate">{p.name}</span>
              </span>
              <button
                onClick={() => toast.info(`${p.name} integration is coming soon`)}
                className="rounded-md bg-[color:var(--c-2a2b2e)] px-3 py-1 text-[12.5px] font-medium text-[color:var(--c-e5e5e5)] hover:bg-[color:var(--c-333438)] transition"
              >
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
