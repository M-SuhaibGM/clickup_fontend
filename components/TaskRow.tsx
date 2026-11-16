'use client';

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/types/task';
import Image from 'next/image';
import {
  Circle,
  CheckCircle2,
  CircleDashed,
  MessageSquare,
  UserCircle,
  Flag,
  Calendar as CalendarIcon,
  Plus,
  Pencil,
  ChevronRight,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';

const STATUS_ICONS: Record<string, any> = {
  TODO: Circle,
  IN_PROGRESS: CircleDashed,
  DONE: CheckCircle2,
};

const STATUS_LABEL: Record<string, string> = {
  TODO: 'TO DO',
  IN_PROGRESS: 'IN PROGRESS',
  DONE: 'COMPLETE',
};

export default function TaskRow({ task, onClick, allTasks = [] }: { task: Task; onClick: () => void; allTasks?: Task[] }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const updateTask = useTaskStore((s) => s.updateTask);
  const createTask = useTaskStore((s) => s.createTask);

  const [isEditing, setIsEditing] = useState(false);
  const [taskTitle, setTaskTitle] = useState(task.title);
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [submittingSubtask, setSubmittingSubtask] = useState(false);
  const [subtasksOpen, setSubtasksOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const StatusIcon = STATUS_ICONS[task.status] || Circle;
  const due = task.dueDate ? new Date(task.dueDate) : null;

  // Find subtasks belonging to this task
  const childSubtasks = allTasks.filter((t) => t.parentId === task.id);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
    }
  }, [isEditing]);

  const handleSaveTitle = async () => {
    if (taskTitle.trim() && taskTitle !== task.title) {
      await updateTask(task.listId, task.id, { title: taskTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleAddSubtask = async () => {
    if (!subtaskTitle.trim() || submittingSubtask) return;
    setSubmittingSubtask(true);
    try {
      const newSubtask: { title: string; parentId: string } = {
        title: subtaskTitle.trim(),
        parentId: task.id,
      };
      await createTask(task.listId, newSubtask);
      setSubtaskTitle('');
      // Keep input open for multiple subtask creation
      inputRef.current?.focus();
    } finally {
      setSubmittingSubtask(false);
    }
  };

  return (
    <>
      <div className="group/row">
        <div
          ref={setNodeRef}
          style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
          {...attributes}
          {...listeners}
          onClick={onClick}
          className="grid grid-cols-[1fr_120px_120px_150px_100px_40px] gap-2 px-3 py-2.5 border-b border-[#333438] hover:bg-[#2a2b2e] transition-colors cursor-pointer items-center text-[13px] text-[#e5e5e5]"
        >
          {/* Name & Quick Hover Actions */}
          <div className="flex items-center gap-2 truncate relative" onClick={(e) => e.stopPropagation()}>
            {childSubtasks.length > 0 && (
              <button onClick={() => setSubtasksOpen(!subtasksOpen)} className="text-[#8a8c91] hover:text-white">
                {subtasksOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            )}
            <Circle className="h-4 w-4 text-[#8a8c91] shrink-0" />
            
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') {
                    setTaskTitle(task.title);
                    setIsEditing(false);
                  }
                }}
                className="bg-[#1e1f21] border border-indigo-500 rounded px-1.5 py-0.5 text-white text-[13px] outline-none w-full"
              />
            ) : (
              <span className="truncate flex-1" onDoubleClick={() => setIsEditing(true)}>{task.title}</span>
            )}

            {/* Subtask count badge */}
            {childSubtasks.length > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-[#8a8c91] bg-[#232426] px-1.5 py-0.5 rounded border border-[#333438]">
                ↳ {childSubtasks.length}
              </span>
            )}

            {/* Hover Action Buttons */}
            <div className="opacity-0 group-hover/row:opacity-100 flex items-center gap-1 bg-[#2a2b2e] px-1 rounded transition-opacity shrink-0 ml-auto">
              <button
                title="Add Subtask"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSubtaskInput(!showSubtaskInput);
                  setSubtasksOpen(true);
                }}
                className="p-1 hover:bg-[#333438] rounded text-[#8a8c91] hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                title="Rename task"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="p-1 hover:bg-[#333438] rounded text-[#8a8c91] hover:text-white"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Assignee */}
          <div className="flex items-center">
            {task.assignee ? (
              <Image src={task.assignee.avatar || ''} alt="A" width={24} height={24} className="rounded-full border border-[#333438]" />
            ) : (
              <div className="h-6 w-6 rounded-full bg-[#2a2b2e] border border-[#333438] flex items-center justify-center">
                <UserCircle className="h-4 w-4 text-[#8a8c91]" />
              </div>
            )}
          </div>

          {/* Due Date */}
          <div className="text-[12px] text-[#8a8c91]">
            {due ? due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : <CalendarIcon className="h-4 w-4 text-[#8a8c91]" />}
          </div>

          {/* Priority */}
          <div>
            <span className="flex items-center gap-1 text-[12px] text-[#8a8c91]">
              <Flag className="h-3.5 w-3.5" /> {task.priority || 'Normal'}
            </span>
          </div>

          {/* Status Pill */}
          <div>
            <span className="flex items-center justify-center gap-1.5 px-2 py-0.5 bg-[#2a2b2e] border border-[#333438] rounded text-[11px] font-bold text-[#e5e5e5] w-max">
              <StatusIcon className="h-3.5 w-3.5" /> {STATUS_LABEL[task.status]}
            </span>
          </div>

          {/* Comments */}
          <div className="flex justify-center">
            <MessageSquare className="h-3.5 w-3.5 text-[#8a8c91] group-hover/row:opacity-100 opacity-60" />
          </div>
        </div>

        {/* Inline Subtask Creation Input row with loading and multi-add support */}
        {showSubtaskInput && (
          <div className="pl-10 pr-3 py-2 bg-[#232426]/80 border-b border-[#333438] flex items-center gap-2">
            <span className="text-[11px] text-indigo-400 font-semibold">+ Subtask:</span>
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={subtaskTitle}
              onChange={(e) => setSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSubtask();
                if (e.key === 'Escape') setShowSubtaskInput(false);
              }}
              placeholder="Subtask name... (Press Enter to add multiple)"
              disabled={submittingSubtask}
              className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-[#8a8c91]"
            />
            <button
              onClick={handleAddSubtask}
              disabled={submittingSubtask || !subtaskTitle.trim()}
              className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-1"
            >
              {submittingSubtask && <Loader2 className="h-3 w-3 animate-spin" />}
              {submittingSubtask ? 'Adding...' : 'Add'}
            </button>
            <button onClick={() => setShowSubtaskInput(false)} className="px-2 py-1 text-xs text-[#8a8c91] hover:text-white">Done</button>
          </div>
        )}
      </div>

      {/* Render Subtasks in Tree / Nested Format */}
      {subtasksOpen && childSubtasks.map((sub) => (
        <div key={sub.id} onClick={() => onClick()} className="grid grid-cols-[1fr_120px_120px_150px_100px_40px] gap-2 px-3 py-2 pl-8 border-b border-[#333438]/50 bg-[#191a1c] hover:bg-[#222326] transition-colors cursor-pointer items-center text-[12px] text-[#cccccc]">
          <div className="flex items-center gap-2 truncate">
            <span className="text-indigo-400 font-mono text-[10px]">└─</span>
            <Circle className="h-3.5 w-3.5 text-[#8a8c91] shrink-0" />
            <span className="truncate">{sub.title}</span>
          </div>
          <div className="text-xs text-[#8a8c91]">-</div>
          <div className="text-xs text-[#8a8c91]">-</div>
          <div className="text-xs text-[#8a8c91]">{sub.priority}</div>
          <div>
            <span className="px-1.5 py-0.5 bg-[#2a2b2e] rounded text-[10px] text-white">{sub.status}</span>
          </div>
          <div></div>
        </div>
      ))}
    </>
  );
}