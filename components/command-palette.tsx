'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/store/projectStore';
import { useListStore } from '@/store/listStore';
import { useTaskStore } from '@/store/taskStore';
import { useWorkspaceStore } from '@/store/workspaceStore'; // ← Import
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Folder, List as ListIcon, CheckSquare, Building2 } from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  // Stores
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspaceStore();
  const projects = useProjectStore((s) => s.projects);
  const listsByProject = useListStore((s) => s.listsByProject);
  const tasksByList = useTaskStore((s) => s.tasksByList);

  // Flatten lists for easy searching
  const allLists = React.useMemo(() => {
    return Object.entries(listsByProject).flatMap(([projectId, lists]) =>
      lists.map((list) => ({ ...list, projectId }))
    );
  }, [listsByProject]);

  // Flatten tasks for easy searching
  const allTasks = React.useMemo(() => {
    return Object.entries(tasksByList).flatMap(([listId, tasks]) =>
      tasks
        .filter((t) => !t.parentId) // Only show main tasks
        .map((task) => ({ ...task, listId }))
    );
  }, [tasksByList]);

  // Keyboard shortcut listener
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

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false);
      command();
    },
    []
  );

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search workspaces, projects, tasks..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* ─── WORKSPACES ─── */}
          <CommandGroup heading="Workspaces">
            {workspaces.map((ws) => (
              <CommandItem
                key={ws.id}
                value={`workspace-${ws.id}-${ws.name}`}
                onSelect={() =>
                  runCommand(() => {
                    setActiveWorkspace(ws);
                    router.push('/dashboard');
                  })
                }
              >
                <Building2 className="mr-2 h-4 w-4 text-blue-500" />
                <span>{ws.name}</span>
                {activeWorkspace?.id === ws.id && (
                  <span className="ml-auto text-[10px] text-muted-foreground">Active</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* ─── PROJECTS ─── */}
          <CommandGroup heading="Projects">
            {projects.map((project) => (
              <CommandItem
                key={project.id}
                value={`project-${project.id}-${project.name}`}
                onSelect={() =>
                  runCommand(() => router.push(`/projects/${project.id}`))
                }
              >
                <Folder className="mr-2 h-4 w-4 text-indigo-500" />
                <span>{project.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* ─── LISTS ─── */}
          <CommandGroup heading="Lists">
            {allLists.map((list) => (
              <CommandItem
                key={list.id}
                value={`list-${list.id}-${list.name}`}
                onSelect={() =>
                  runCommand(() => router.push(`/projects/${list.projectId}?listId=${list.id}`))
                }
              >
                <ListIcon className="mr-2 h-4 w-4 text-emerald-500" />
                <span>{list.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* ─── TASKS ─── */}
          <CommandGroup heading="Tasks">
            {allTasks.map((task) => (
              <CommandItem
                key={task.id}
                value={`task-${task.id}-${task.title}`}
                onSelect={() =>
                  runCommand(() => {
                    // ─── NEW: Navigate directly to the task page ───
                    router.push(`/tasks/${task.id}`);
                  })
                }
              >
                <CheckSquare className="mr-2 h-4 w-4 text-orange-500" />
                <span>{task.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}