'use client';

import type { ReactNode } from 'react';
import { ChevronsLeft } from 'lucide-react';

/** Title row shared by the route-specific sidebars: title, collapse button, optional action. */
export default function SidebarHeader({ title, onCollapse, action }: { title: string; onCollapse?: () => void; action?: ReactNode }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between shrink-0 group/header">
      <h2 className="text-[15px] font-semibold text-[color:var(--c-white)]">{title}</h2>
      <div className="flex items-center gap-2">
        {onCollapse && (
          <button
            onClick={onCollapse}
            aria-label="Collapse sidebar"
            className="p-1 text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] rounded hover:bg-[color:var(--c-2a2b2e)] transition-colors"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        )}
        {action}
      </div>
    </div>
  );
}
