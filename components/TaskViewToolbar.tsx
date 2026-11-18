'use client';

import { useState, type ReactNode } from 'react';
import { CheckCircle2, Filter, GitFork, Layers, Search, Settings, UserCircle, X } from 'lucide-react';
import { GROUP_LABEL, UNASSIGNED, type GroupBy } from '@/lib/taskGrouping';
import { PRIORITY_OPTIONS } from '@/lib/taskColumns';
import type { UserSummary } from '@/store/userStore';
import UserAvatar from './UserAvatar';
import { MenuLabel, MenuRow, ToolbarMenu, tbBtn, tbIdle, tbOn } from './ToolbarMenu';

interface Props {
  groupBy: GroupBy;
  onGroupBy: (g: GroupBy) => void;
  showSubtasks: boolean;
  onToggleSubtasks: () => void;
  showClosed: boolean;
  onToggleClosed: () => void;
  priorityFilter: string[];
  onPriorityFilter: (next: string[]) => void;
  assigneeFilter: string | null;
  onAssigneeFilter: (next: string | null) => void;
  search: string;
  onSearch: (q: string) => void;
  users: UserSummary[];
  me: { id: string; name: string; avatar: string | null } | null;
  onReset: () => void;
  /** only given to admins */
  onAddTask?: () => void;
  /** view-specific menus (Columns for the list, Sort for the board), placed before Filter */
  extraRight?: ReactNode;
}

/** The toolbar shared by the List and Board views. */
export default function TaskViewToolbar(p: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const myTasksOn = !!p.me && p.assigneeFilter === p.me.id;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
      <div className="flex items-center gap-1.5">
        <ToolbarMenu
          button={(open, toggle) => (
            <button
              onClick={toggle}
              aria-expanded={open}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30 text-[12px] font-medium transition"
            >
              <Layers className="h-3.5 w-3.5" /> Group: {GROUP_LABEL[p.groupBy]}
            </button>
          )}
        >
          {(close) => (
            <>
              <MenuLabel>Group by</MenuLabel>
              {(Object.keys(GROUP_LABEL) as GroupBy[]).map((g) => (
                <MenuRow key={g} active={p.groupBy === g} onClick={() => { p.onGroupBy(g); close(); }}>
                  {GROUP_LABEL[g]}
                </MenuRow>
              ))}
            </>
          )}
        </ToolbarMenu>

        <button onClick={p.onToggleSubtasks} aria-pressed={p.showSubtasks} className={`${tbBtn} ${p.showSubtasks ? tbOn : tbIdle}`}>
          <GitFork className="h-3.5 w-3.5" /> Subtasks
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-0.5">
        {p.extraRight}

        <ToolbarMenu
          align="right"
          button={(open, toggle) => (
            <button onClick={toggle} aria-expanded={open} className={`${tbBtn} ${p.priorityFilter.length ? tbOn : tbIdle}`}>
              <Filter className="h-3.5 w-3.5" /> Filter{p.priorityFilter.length > 0 && <span className="font-semibold">· {p.priorityFilter.length}</span>}
            </button>
          )}
        >
          {() => (
            <>
              <MenuLabel>Priority</MenuLabel>
              {PRIORITY_OPTIONS.map((o) => (
                <MenuRow
                  key={o.value}
                  active={p.priorityFilter.includes(o.value)}
                  onClick={() => p.onPriorityFilter(p.priorityFilter.includes(o.value) ? p.priorityFilter.filter((x) => x !== o.value) : [...p.priorityFilter, o.value])}
                >
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: o.color }} /> {o.label}
                </MenuRow>
              ))}
              {p.priorityFilter.length > 0 && (
                <button onClick={() => p.onPriorityFilter([])} className="mt-1 w-full border-t border-[color:var(--c-333438)] px-2.5 py-1.5 text-left text-[12px] text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]">
                  Clear filter
                </button>
              )}
            </>
          )}
        </ToolbarMenu>

        <button
          onClick={p.onToggleClosed}
          aria-pressed={p.showClosed}
          title={p.showClosed ? 'Hide completed tasks' : 'Show completed tasks'}
          className={`${tbBtn} ${p.showClosed ? tbOn : tbIdle}`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Closed
        </button>

        <ToolbarMenu
          align="right"
          button={(open, toggle) => (
            <button onClick={toggle} aria-expanded={open} className={`${tbBtn} ${p.assigneeFilter ? tbOn : tbIdle}`}>
              <UserCircle className="h-3.5 w-3.5" />
              {p.assigneeFilter === UNASSIGNED ? 'Unassigned' : p.users.find((u) => u.id === p.assigneeFilter)?.name ?? 'Assignee'}
            </button>
          )}
        >
          {(close) => (
            <>
              <MenuRow active={p.assigneeFilter === null} onClick={() => { p.onAssigneeFilter(null); close(); }}>Anyone</MenuRow>
              <MenuRow active={p.assigneeFilter === UNASSIGNED} onClick={() => { p.onAssigneeFilter(UNASSIGNED); close(); }}>Unassigned</MenuRow>
              {p.users.map((u) => (
                <MenuRow key={u.id} active={p.assigneeFilter === u.id} onClick={() => { p.onAssigneeFilter(u.id); close(); }}>
                  <UserAvatar name={u.name} src={u.avatar} size={18} />
                  <span className="truncate">{u.name}{u.id === p.me?.id ? ' (me)' : ''}</span>
                </MenuRow>
              ))}
            </>
          )}
        </ToolbarMenu>

        {p.me && (
          <button
            onClick={() => p.onAssigneeFilter(myTasksOn ? null : p.me!.id)}
            title={myTasksOn ? 'Showing only my tasks' : 'Show only my tasks'}
            aria-pressed={myTasksOn}
            className={`mx-0.5 rounded-full p-0.5 transition ${myTasksOn ? 'ring-2 ring-indigo-500' : 'opacity-80 hover:opacity-100'}`}
          >
            <UserAvatar name={p.me.name} src={p.me.avatar} size={22} />
          </button>
        )}

        {searchOpen || p.search ? (
          <div className="flex items-center gap-1.5 rounded-md border border-[color:var(--c-333438)] bg-[color:var(--c-232426)] px-2 py-1">
            <Search className="h-3.5 w-3.5 text-[color:var(--c-8a8c91)]" />
            <input
              autoFocus
              value={p.search}
              onChange={(e) => p.onSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && (p.onSearch(''), setSearchOpen(false))}
              onBlur={() => !p.search && setSearchOpen(false)}
              placeholder="Search tasks"
              className="w-32 bg-transparent text-[12px] text-[color:var(--c-white)] outline-none placeholder:text-[color:var(--c-8a8c91)]"
            />
            <button onClick={() => { p.onSearch(''); setSearchOpen(false); }} aria-label="Clear search" className="text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]">
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button onClick={() => setSearchOpen(true)} aria-label="Search tasks" className={`${tbBtn} ${tbIdle} !px-1.5`}>
            <Search className="h-3.5 w-3.5" />
          </button>
        )}

        <ToolbarMenu
          align="right"
          button={(open, toggle) => (
            <button onClick={toggle} aria-expanded={open} aria-label="View settings" className={`${tbBtn} ${tbIdle} !px-1.5`}>
              <Settings className="h-3.5 w-3.5" />
            </button>
          )}
        >
          {(close) => <MenuRow onClick={() => { p.onReset(); setSearchOpen(false); close(); }}>Reset view</MenuRow>}
        </ToolbarMenu>

        {p.onAddTask && (
          <button
            onClick={p.onAddTask}
            className="ml-1.5 flex items-center gap-1 rounded-md bg-[color:var(--c-white)] px-3 py-1 text-[12px] font-semibold text-[color:var(--c-1e1f21)] hover:opacity-85 transition"
          >
            Add Task
          </button>
        )}
      </div>
    </div>
  );
}
