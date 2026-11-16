'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/store/projectStore';
import { useListStore } from '@/store/listStore';
import { useTaskStore } from '@/store/taskStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Command } from 'cmdk';
import { 
  Search, 
  Sparkles, 
  LayoutGrid, 
  Folder, 
  List as ListIcon, 
  CheckSquare, 
  Hash,
  Mail,
  MessageSquare,
  FileText,
  Bot
} from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  // Stores
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspaceStore();
  const projects = useProjectStore((s) => s.projects);
  const listsByProject = useListStore((s) => s.listsByProject);
  const tasksByList = useTaskStore((s) => s.tasksByList);

  // Flatten data for search
  const allLists = React.useMemo(() => {
    return Object.entries(listsByProject).flatMap(([projectId, lists]) =>
      lists.map((list) => ({ ...list, projectId }))
    );
  }, [listsByProject]);

  const allTasks = React.useMemo(() => {
    return Object.entries(tasksByList).flatMap(([listId, tasks]) =>
      tasks
        .filter((t) => !t.parentId)
        .map((task) => ({ ...task, listId }))
    );
  }, [tasksByList]);

  // ⌘K / Ctrl+K listener
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-start justify-center pt-[10vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-[color:var(--c-1e1f21)] border border-[color:var(--c-333438)] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        <Command label="Command Palette" className="flex flex-col h-full bg-transparent">
          
          {/* Top Search Bar */}
          <div className="flex items-center px-4 py-3 border-b border-[color:var(--c-333438)]">
            <Search className="h-4 w-4 text-[color:var(--c-8a8c91)] mr-3 shrink-0" />
            <Command.Input 
              autoFocus
              placeholder="Search, run a command, or ask a question..." 
              className="flex-1 bg-transparent text-sm text-[color:var(--c-e5e5e5)] outline-none placeholder:text-[color:var(--c-8a8c91)]"
            />
            <button className="flex items-center gap-1.5 px-2.5 py-1 bg-[color:var(--c-2a2b2e)] hover:bg-[color:var(--c-333438)] rounded-md border border-[color:var(--c-444548)] text-[11px] font-medium text-[color:var(--c-e5e5e5)] transition">
              Ask AI <Sparkles className="h-3 w-3 text-[#c4b5fd]" />
            </button>
          </div>

          {/* Tabs & Filters */}
          <div className="flex flex-col gap-2 px-4 py-2 border-b border-[color:var(--c-333438)] overflow-x-auto no-scrollbar">
            {/* Source Tabs */}
            <div className="flex items-center gap-4 text-[13px] font-medium text-[color:var(--c-8a8c91)]">
              <span className="text-[color:var(--c-white)] border-b-2 border-[color:var(--c-white)] pb-1 cursor-pointer">All</span>
              <span className="flex items-center gap-1.5 hover:text-[color:var(--c-white)] cursor-pointer transition"><LayoutGrid className="h-3.5 w-3.5 text-[#e05c7b]" /> ClickUp</span>
              <span className="flex items-center gap-1.5 hover:text-[color:var(--c-white)] cursor-pointer transition"><Hash className="h-3.5 w-3.5" /> GitHub</span>
              <span className="flex items-center gap-1.5 hover:text-[color:var(--c-white)] cursor-pointer transition"><Mail className="h-3.5 w-3.5" /> Gmail</span>
              <span className="flex items-center gap-1.5 hover:text-[color:var(--c-white)] cursor-pointer transition"><Folder className="h-3.5 w-3.5 text-primary" /> Google Drive</span>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 mt-1">
              {[
                { icon: CheckSquare, label: 'Tasks' },
                { icon: FileText, label: 'Docs' },
                { icon: Bot, label: 'Agents' },
                { icon: Hash, label: 'Channels' },
                { icon: MessageSquare, label: 'Messages' },
              ].map((filter) => (
                <button key={filter.label} className="flex items-center gap-1.5 px-2.5 py-1 bg-[color:var(--c-2a2b2e)] border border-[color:var(--c-333438)] rounded-md text-[11px] text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] transition">
                  <filter.icon className="h-3 w-3" /> {filter.label}
                </button>
              ))}
              <button className="text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] px-1">•••</button>
              <div className="flex-1" />
              <button className="flex items-center gap-1.5 px-2.5 py-1 hover:bg-[color:var(--c-2a2b2e)] rounded-md text-[11px] text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] transition">
                 Filter
              </button>
              <button className="flex items-center gap-1.5 px-2.5 py-1 hover:bg-[color:var(--c-2a2b2e)] rounded-md text-[11px] text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] transition">
                 Sort
              </button>
            </div>
          </div>

          {/* Results List */}
          <Command.List className="flex-1 max-h-[60vh] overflow-y-auto p-2 outline-none">
            <Command.Empty className="py-12 text-center text-sm text-[color:var(--c-8a8c91)]">No results found.</Command.Empty>
            
            <Command.Group heading="Results" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[color:var(--c-8a8c91)] [&_[cmdk-group-heading]]:uppercase">
              
              {/* Workspaces */}
              {workspaces.map((ws) => (
                <Command.Item
                  key={ws.id}
                  value={`workspace-${ws.id}-${ws.name}`}
                  onSelect={() => runCommand(() => { setActiveWorkspace(ws); router.push('/dashboard'); })}
                  className="flex items-center px-2 py-2.5 rounded-md text-[13px] text-[color:var(--c-e5e5e5)] cursor-pointer aria-selected:bg-[color:var(--c-2a2b2e)] transition-colors group"
                >
                  <LayoutGrid className="mr-3 h-4 w-4 text-[#e05c7b] shrink-0" />
                  <span className="flex-1 truncate">{ws.name}</span>
                  {activeWorkspace?.id === ws.id && <span className="text-[10px] text-[color:var(--c-8a8c91)] bg-[color:var(--c-333438)] px-1.5 py-0.5 rounded">Active</span>}
                </Command.Item>
              ))}

              {/* Projects */}
              {projects.map((project) => (
                <Command.Item
                  key={project.id}
                  value={`project-${project.id}-${project.name}`}
                  onSelect={() => runCommand(() => router.push(`/projects/${project.id}`))}
                  className="flex items-center px-2 py-2.5 rounded-md text-[13px] text-[color:var(--c-e5e5e5)] cursor-pointer aria-selected:bg-[color:var(--c-2a2b2e)] transition-colors"
                >
                  <Folder className="mr-3 h-4 w-4 text-primary shrink-0" />
                  <span className="flex-1 truncate">{project.name}</span>
                  <span className="text-[11px] text-[color:var(--c-8a8c91)] opacity-0 group-aria-selected:opacity-100">Project</span>
                </Command.Item>
              ))}

              {/* Lists */}
              {allLists.map((list) => (
                <Command.Item
                  key={list.id}
                  value={`list-${list.id}-${list.name}`}
                  onSelect={() => runCommand(() => router.push(`/projects/${list.projectId}?listId=${list.id}`))}
                  className="flex items-center px-2 py-2.5 rounded-md text-[13px] text-[color:var(--c-e5e5e5)] cursor-pointer aria-selected:bg-[color:var(--c-2a2b2e)] transition-colors"
                >
                  <ListIcon className="mr-3 h-4 w-4 text-[color:var(--c-8a8c91)] shrink-0" />
                  <span className="flex-1 truncate">{list.name}</span>
                  <span className="text-[11px] text-[color:var(--c-8a8c91)] opacity-0 group-aria-selected:opacity-100">List</span>
                </Command.Item>
              ))}

              {/* Tasks */}
              {allTasks.map((task) => (
                <Command.Item
                  key={task.id}
                  value={`task-${task.id}-${task.title}`}
                  onSelect={() => runCommand(() => router.push(`/tasks/${task.id}`))}
                  className="flex items-center px-2 py-2.5 rounded-md text-[13px] text-[color:var(--c-e5e5e5)] cursor-pointer aria-selected:bg-[color:var(--c-2a2b2e)] transition-colors"
                >
                  <CheckSquare className="mr-3 h-4 w-4 text-[color:var(--c-8a8c91)] shrink-0" />
                  <span className="flex-1 truncate">{task.title}</span>
                  <span className="text-[11px] text-[color:var(--c-8a8c91)] shrink-0">Task</span>
                </Command.Item>
              ))}

            </Command.Group>
          </Command.List>

          {/* Footer Hints */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-[color:var(--c-333438)] bg-[color:var(--c-232426)] text-[11px] text-[color:var(--c-8a8c91)]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><kbd className="bg-[color:var(--c-2a2b2e)] border border-[color:var(--c-333438)] px-1.5 py-0.5 rounded text-[10px]">↑</kbd><kbd className="bg-[color:var(--c-2a2b2e)] border border-[color:var(--c-333438)] px-1.5 py-0.5 rounded text-[10px]">↓</kbd> Navigate</span>
              <span className="flex items-center gap-1"><kbd className="bg-[color:var(--c-2a2b2e)] border border-[color:var(--c-333438)] px-1.5 py-0.5 rounded text-[10px]">↵</kbd> Select</span>
              <span className="flex items-center gap-1"><kbd className="bg-[color:var(--c-2a2b2e)] border border-[color:var(--c-333438)] px-1.5 py-0.5 rounded text-[10px]">Esc</kbd> Close</span>
            </div>
            <div>
              Tip · Use AI to write, plan, or answer
            </div>
          </div>

        </Command>
      </div>
    </div>
  );
}