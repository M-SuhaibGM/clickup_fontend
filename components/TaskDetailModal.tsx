'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTaskStore } from '@/store/taskStore';
import { useUserStore } from '@/store/userStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import type { Task, Comment } from '@/types/task';
import { api } from '@/lib/api';
import { UploadDropzone } from '@/lib/uploadthing';
import Image from 'next/image';
import {
  X,
  Circle,
  CheckCircle2,
  CircleDashed,
  Calendar,
  Clock,
  Tag,
  User as UserIcon,
  Flag,
  ListTodo,
  MessageSquare,
  Paperclip,
  Plus,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Pencil,
  Trash2,
  MoreHorizontal,
  ArrowUpRight,
  Sparkles,
  Loader2,
  Bell,
  Search,
  Send,
} from 'lucide-react';

const STATUSES = [
  { value: 'TODO', label: 'TO DO', icon: Circle, color: '#8a8c91' },
  { value: 'IN_PROGRESS', label: 'IN PROGRESS', icon: CircleDashed, color: '#7c3aed' },
  { value: 'DONE', label: 'COMPLETE', icon: CheckCircle2, color: '#22c55e' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low', color: '#8a8c91' },
  { value: 'NORMAL', label: 'Normal', color: '#3b82f6' },
  { value: 'HIGH', label: 'High', color: '#f59e0b' },
  { value: 'URGENT', label: 'Urgent', color: '#ef4444' },
];

interface TaskDetailModalProps {
  taskId: string;
  listId: string;
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

export default function TaskDetailModal({ taskId, listId, open, onClose, isAdmin }: TaskDetailModalProps) {
  const router = useRouter();
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const users = useUserStore((s) => s.users);
  const currentUser = useAuthStore((s) => s.user);

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('TODO');
  const [priority, setPriority] = useState('NORMAL');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);

  // UI state
  const [saving, setSaving] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [subtasksOpen, setSubtasksOpen] = useState(true);
  const [newSubtask, setNewSubtask] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const assigneeRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Load task data
  useEffect(() => {
    if (!open || !taskId) return;
    setLoading(true);
    (async () => {
      try {
        const { data } = await api.get<{ task: Task }>(`/tasks/${taskId}`);
        setTask(data.task);
        setTitle(data.task.title);
        setDescription(data.task.description ?? '');
        setStatus(data.task.status);
        setPriority(data.task.priority);
        setDueDate(data.task.dueDate ? data.task.dueDate.slice(0, 10) : '');
        setAssigneeId(data.task.assigneeId ?? '');
        setAttachments(data.task.attachments || []);
      } catch {
        toast.error('Failed to load task');
        onClose();
      } finally {
        setLoading(false);
      }
    })();
  }, [open, taskId, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) setShowAssigneeDropdown(false);
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setShowStatusDropdown(false);
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) setShowPriorityDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSave = useCallback(async (field: string, value: any) => {
    if (!task || !isAdmin) return;
    setSaving(true);
    try {
      await updateTask(task.id, listId, { [field]: value });
    } catch {
      toast.error('Failed to update task');
    } finally {
      setSaving(false);
    }
  }, [task, listId, isAdmin, updateTask]);

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    setShowStatusDropdown(false);
    await handleSave('status', newStatus);
  };

  const handlePriorityChange = async (newPriority: string) => {
    setPriority(newPriority);
    setShowPriorityDropdown(false);
    await handleSave('priority', newPriority);
  };

  const handleAssigneeChange = async (userId: string) => {
    setAssigneeId(userId);
    setShowAssigneeDropdown(false);
    await handleSave('assigneeId', userId || null);
  };

  const handleDueDateChange = async (date: string) => {
    setDueDate(date);
    await handleSave('dueDate', date ? new Date(date).toISOString() : null);
  };

  const handleTitleBlur = async () => {
    if (title.trim() && title !== task?.title) {
      await handleSave('title', title.trim());
    }
  };

  const handleDescriptionBlur = async () => {
    if (description !== (task?.description ?? '')) {
      await handleSave('description', description.trim() || null);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || postingComment || !task) return;
    const text = newComment.trim();
    setNewComment('');
    setPostingComment(true);

    setTask(prev => prev ? {
      ...prev,
      comments: [...(prev.comments ?? []), {
        id: 'temp-' + Date.now(),
        taskId: prev.id,
        text,
        createdAt: new Date().toISOString(),
        userId: currentUser?.id ?? '',
        user: { id: currentUser?.id ?? '', name: currentUser?.name ?? 'You', avatar: currentUser?.avatar ?? null },
      }],
    } : prev);

    try {
      await api.post(`/tasks/${task.id}/comments`, { text });
      const res = await api.get<{ task: Task }>(`/tasks/${task.id}`);
      setTask(res.data.task);
    } catch {
      toast.error('Failed to add comment');
      const res = await api.get<{ task: Task }>(`/tasks/${task.id}`);
      setTask(res.data.task);
    } finally {
      setPostingComment(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    try {
      await api.patch(`/tasks/comments/${commentId}`, { text: editCommentText });
      setTask(prev => prev ? {
        ...prev,
        comments: prev.comments?.map(c => c.id === commentId ? { ...c, text: editCommentText } : c),
      } : prev);
      setEditingCommentId(null);
      toast.success('Comment updated');
    } catch {
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.delete(`/tasks/comments/${commentId}`);
      setTask(prev => prev ? {
        ...prev,
        comments: prev.comments?.filter(c => c.id !== commentId),
      } : prev);
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleToggleSubtask = async (subtask: Task) => {
    const newStatus = subtask.status === 'DONE' ? 'TODO' : 'DONE';
    setTask(prev => prev ? {
      ...prev,
      subtasks: prev.subtasks?.map(st => st.id === subtask.id ? { ...st, status: newStatus } : st),
    } : prev);
    try {
      await api.patch(`/tasks/${subtask.id}`, { status: newStatus });
    } catch {
      setTask(prev => prev ? {
        ...prev,
        subtasks: prev.subtasks?.map(st => st.id === subtask.id ? { ...st, status: subtask.status } : st),
      } : prev);
      toast.error('Failed to update subtask');
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim() || addingSubtask || !task) return;
    setAddingSubtask(true);
    try {
      const { data } = await api.post<{ task: Task }>(`/lists/${listId}/tasks`, {
        title: newSubtask.trim(),
        parentId: task.id,
      });
      setTask(prev => prev ? { ...prev, subtasks: [...(prev.subtasks ?? []), data.task] } : prev);
      setNewSubtask('');
    } catch {
      toast.error('Failed to add subtask');
    } finally {
      setAddingSubtask(false);
    }
  };

  const handleDeleteSubtask = (subtask: Task) => {
    setConfirmDialog({
      title: 'Delete Subtask',
      message: `Are you sure you want to delete "${subtask.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setTask(prev => prev ? { ...prev, subtasks: prev.subtasks?.filter(st => st.id !== subtask.id) } : prev);
        try {
          await deleteTask(subtask.id, listId);
          toast.success('Subtask deleted');
        } catch {
          setTask(prev => prev ? { ...prev, subtasks: [...(prev.subtasks ?? []), subtask] } : prev);
          toast.error('Failed to delete subtask');
        }
      },
    });
  };

  const handleDeleteTask = () => {
    if (!task || !isAdmin) return;
    setConfirmDialog({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task and all its subtasks and comments? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await deleteTask(task.id, listId);
          toast.success('Task deleted');
          onClose();
        } catch {
          toast.error('Failed to delete task');
        }
      },
    });
  };

  const handleFileUpload = async (uploadedFiles: { url: string }[]) => {
    if (!task) return;
    const newUrls = uploadedFiles.map(f => f.url);
    const allUrls = [...attachments, ...newUrls];
    setAttachments(allUrls);
    try {
      await updateTask(task.id, listId, { attachments: allUrls });
      toast.success(`${uploadedFiles.length} file(s) attached`);
    } catch {
      toast.error('Failed to save attachments');
    }
  };

  const handleRemoveFile = async (urlToRemove: string) => {
    if (!task) return;
    const newUrls = attachments.filter(url => url !== urlToRemove);
    setAttachments(newUrls);
    try {
      await updateTask(task.id, listId, { attachments: newUrls });
      toast.success('File removed');
    } catch {
      toast.error('Failed to remove file');
    }
  };

  if (!open) return null;

  const selectedStatus = STATUSES.find(s => s.value === status) ?? STATUSES[0];
  const selectedPriority = PRIORITIES.find(p => p.value === priority) ?? PRIORITIES[1];
  const selectedAssignee = users.find(u => u.id === assigneeId);
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(assigneeSearch.toLowerCase())
  );
  const completedSubtasks = task?.subtasks?.filter(st => st.status === 'DONE').length ?? 0;
  const totalSubtasks = task?.subtasks?.length ?? 0;
  const StatusIcon = selectedStatus.icon;
  const createdDate = task?.createdAt ? new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh]" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-[95vw] max-w-[1100px] max-h-[88vh] bg-[#1e1f21] border border-[#333438] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#333438] bg-[#232426] shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#2a2b2e] border border-[#333438] rounded text-xs font-medium text-white">
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
              Task
              <ChevronDown className="h-3 w-3 text-[#8a8c91]" />
            </div>
            <div className="flex items-center gap-1 text-[#8a8c91]">
              <button className="p-1 hover:bg-[#333438] rounded" title="Watchers">
                <Bell className="h-3.5 w-3.5" />
              </button>
              <span className="text-[11px]">1</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => router.push(`/tasks/${taskId}`)}
              className="p-1.5 text-[#8a8c91] hover:text-white hover:bg-[#333438] rounded transition"
              title="Open full page"
            >
              <ArrowUpRight className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#8a8c91] hover:text-white hover:bg-[#333438] rounded transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          </div>
        ) : task ? (
          <div className="flex flex-1 overflow-hidden">
            {/* ───────── LEFT PANEL ───────── */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 border-r border-[#333438]">
              {/* Task Title */}
              <div>
                {isAdmin ? (
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    className="w-full text-xl font-bold text-white bg-transparent outline-none border-b-2 border-transparent focus:border-indigo-500 pb-1 transition"
                    placeholder="Task name"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-white">{title}</h2>
                )}
              </div>

              {/* Fields Grid */}
              <div className="space-y-3">
                {/* Status */}
                <div className="flex items-center gap-4">
                  <span className="w-28 text-xs text-[#8a8c91] flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Status
                  </span>
                  <div className="relative" ref={statusRef}>
                    <button
                      onClick={() => isAdmin && setShowStatusDropdown(!showStatusDropdown)}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-[#2a2b2e] border border-[#333438] rounded text-xs font-bold text-white hover:border-[#555] transition"
                    >
                      <StatusIcon className="h-3.5 w-3.5" style={{ color: selectedStatus.color }} />
                      {selectedStatus.label}
                      {isAdmin && <ChevronDown className="h-3 w-3 text-[#8a8c91]" />}
                    </button>
                    {showStatusDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-[#2a2b2e] border border-[#333438] rounded-lg shadow-xl z-20 py-1 w-44">
                        {STATUSES.map(s => {
                          const Icon = s.icon;
                          return (
                            <button
                              key={s.value}
                              onClick={() => handleStatusChange(s.value)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white hover:bg-[#333438] transition"
                            >
                              <Icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                              {s.label}
                              {s.value === status && <Check className="h-3 w-3 ml-auto text-indigo-400" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Assignees */}
                <div className="flex items-center gap-4">
                  <span className="w-28 text-xs text-[#8a8c91] flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5" /> Assignees
                  </span>
                  <div className="relative" ref={assigneeRef}>
                    <button
                      onClick={() => isAdmin && setShowAssigneeDropdown(!showAssigneeDropdown)}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#8a8c91] hover:text-white transition"
                    >
                      {selectedAssignee ? (
                        <span className="flex items-center gap-1.5">
                          {selectedAssignee.avatar ? (
                            <Image src={selectedAssignee.avatar} alt="" width={20} height={20} className="rounded-full" />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                              {selectedAssignee.name?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <span className="text-white">{selectedAssignee.name}</span>
                        </span>
                      ) : (
                        <span>Empty</span>
                      )}
                      {isAdmin && <ChevronDown className="h-3 w-3" />}
                    </button>
                    {showAssigneeDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-[#2a2b2e] border border-[#333438] rounded-lg shadow-xl z-20 w-56 p-2">
                        <input
                          autoFocus
                          value={assigneeSearch}
                          onChange={(e) => setAssigneeSearch(e.target.value)}
                          placeholder="Search..."
                          className="w-full bg-[#1e1f21] border border-[#333438] rounded px-2 py-1 text-xs text-white outline-none mb-1.5"
                        />
                        <div className="max-h-36 overflow-y-auto space-y-0.5">
                          <button
                            onClick={() => handleAssigneeChange('')}
                            className="w-full text-left px-2 py-1.5 text-xs text-[#8a8c91] hover:bg-[#333438] hover:text-white rounded transition"
                          >
                            Unassigned
                          </button>
                          {filteredUsers.map(u => (
                            <button
                              key={u.id}
                              onClick={() => handleAssigneeChange(u.id)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-white hover:bg-[#333438] rounded transition"
                            >
                              {u.avatar ? (
                                <Image src={u.avatar} alt="" width={18} height={18} className="rounded-full" />
                              ) : (
                                <div className="h-[18px] w-[18px] rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">
                                  {u.name?.[0]?.toUpperCase()}
                                </div>
                              )}
                              {u.name}
                              {u.id === assigneeId && <Check className="h-3 w-3 ml-auto text-indigo-400" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center gap-4">
                  <span className="w-28 text-xs text-[#8a8c91] flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Dates
                  </span>
                  <div className="flex items-center gap-2">
                    {isAdmin ? (
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => handleDueDateChange(e.target.value)}
                        className="bg-[#2a2b2e] border border-[#333438] rounded px-2 py-1 text-xs text-white outline-none focus:border-indigo-500 transition"
                      />
                    ) : (
                      <span className="text-xs text-[#8a8c91]">
                        {dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Empty'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Priority */}
                <div className="flex items-center gap-4">
                  <span className="w-28 text-xs text-[#8a8c91] flex items-center gap-1.5">
                    <Flag className="h-3.5 w-3.5" /> Priority
                  </span>
                  <div className="relative" ref={priorityRef}>
                    <button
                      onClick={() => isAdmin && setShowPriorityDropdown(!showPriorityDropdown)}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs hover:text-white transition"
                      style={{ color: selectedPriority.color }}
                    >
                      <Flag className="h-3.5 w-3.5" />
                      {selectedPriority.label}
                      {isAdmin && <ChevronDown className="h-3 w-3 text-[#8a8c91]" />}
                    </button>
                    {showPriorityDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-[#2a2b2e] border border-[#333438] rounded-lg shadow-xl z-20 py-1 w-36">
                        {PRIORITIES.map(p => (
                          <button
                            key={p.value}
                            onClick={() => handlePriorityChange(p.value)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-[#333438] transition"
                            style={{ color: p.color }}
                          >
                            <Flag className="h-3.5 w-3.5" />
                            {p.label}
                            {p.value === priority && <Check className="h-3 w-3 ml-auto text-indigo-400" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-4">
                  <span className="w-28 text-xs text-[#8a8c91] flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" /> Tags
                  </span>
                  <span className="text-xs text-[#8a8c91]">Empty</span>
                </div>
              </div>

              {/* Description */}
              <div className="pt-2">
                {isAdmin ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleDescriptionBlur}
                    placeholder="Add a description..."
                    rows={3}
                    className="w-full bg-transparent border border-transparent hover:border-[#333438] focus:border-indigo-500 rounded-lg p-3 text-sm text-[#e5e5e5] outline-none resize-none transition placeholder:text-[#555]"
                  />
                ) : (
                  <p className="text-sm text-[#e5e5e5] whitespace-pre-wrap">
                    {description || <span className="text-[#555] italic">No description</span>}
                  </p>
                )}
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <button
                  onClick={() => setShowAttachments(!showAttachments)}
                  className="flex items-center gap-2 text-xs font-semibold text-[#8a8c91] hover:text-white transition"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  Attachments {attachments.length > 0 && `(${attachments.length})`}
                  {showAttachments ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
                {showAttachments && (
                  <div className="space-y-2 pl-5">
                    {attachments.map((url, i) => {
                      const filename = url.split('/').pop()?.split('-').pop() || 'File';
                      return (
                        <div key={i} className="flex items-center justify-between bg-[#232426] border border-[#333438] p-2 rounded group">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-[#e5e5e5] hover:text-indigo-400 truncate flex-1">
                            <FileText className="h-3.5 w-3.5 text-[#8a8c91] shrink-0" />
                            <span className="truncate">{filename}</span>
                          </a>
                          {isAdmin && (
                            <button onClick={() => handleRemoveFile(url)} className="text-[#8a8c91] hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition">
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {isAdmin && (
                      <div className="rounded-lg border border-dashed border-[#333438] bg-[#232426]/50">
                        <UploadDropzone
                          endpoint="taskAttachment"
                          onClientUploadComplete={(res) => {
                            if (res) handleFileUpload(res.map(r => ({ url: r.ufsUrl })));
                          }}
                          onUploadError={(error) => { toast.error(`Upload failed: ${error.message}`); }}
                          appearance={{
                            container: 'border-0 bg-transparent p-2',
                            button: 'bg-indigo-600 text-white text-xs h-7 px-3 rounded after:bg-indigo-700 ut-uploading:bg-indigo-700/50',
                            label: 'text-xs text-[#8a8c91] hover:text-indigo-400',
                            allowedContent: 'text-[10px] text-[#555] mt-1',
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Subtasks */}
              <div className="space-y-2 border-t border-[#333438] pt-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSubtasksOpen(!subtasksOpen)}
                    className="flex items-center gap-2 text-xs font-bold text-[#e5e5e5]"
                  >
                    {subtasksOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    <ListTodo className="h-3.5 w-3.5 text-indigo-400" />
                    Subtasks
                    {totalSubtasks > 0 && (
                      <span className="text-[10px] text-[#8a8c91] font-normal ml-1">
                        {completedSubtasks} / {totalSubtasks} done
                      </span>
                    )}
                  </button>
                  {totalSubtasks > 0 && (
                    <div className="w-20 h-1.5 bg-[#333438] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0}%` }}
                      />
                    </div>
                  )}
                </div>

                {subtasksOpen && (
                  <div className="space-y-1 pl-1">
                    {/* Subtask header */}
                    {totalSubtasks > 0 && (
                      <div className="grid grid-cols-[1fr_80px_60px] gap-2 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#555]">
                        <div>Name</div>
                        <div>Assignee</div>
                        <div>Priority</div>
                      </div>
                    )}
                    {task?.subtasks?.map(st => (
                      <div key={st.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#232426] rounded transition group">
                        <input
                          type="checkbox"
                          checked={st.status === 'DONE'}
                          onChange={() => isAdmin && handleToggleSubtask(st)}
                          disabled={!isAdmin}
                          className={`h-3.5 w-3.5 rounded border-[#555] accent-indigo-500 ${isAdmin ? 'cursor-pointer' : 'cursor-default opacity-60'}`}
                        />
                        <span className={`text-xs flex-1 truncate ${st.status === 'DONE' ? 'line-through text-[#555]' : 'text-[#e5e5e5]'}`}>
                          {st.title}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteSubtask(st)}
                            className="p-0.5 text-[#555] hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                            title="Delete subtask"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    {isAdmin && (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          value={newSubtask}
                          onChange={(e) => setNewSubtask(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubtask(); }}
                          placeholder="Add subtask..."
                          disabled={addingSubtask}
                          className="flex-1 bg-transparent border-b border-[#333438] focus:border-indigo-500 text-xs text-white outline-none py-1.5 px-1 placeholder:text-[#555] transition"
                        />
                        <button
                          onClick={handleAddSubtask}
                          disabled={addingSubtask || !newSubtask.trim()}
                          className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 disabled:opacity-50 px-2 py-1"
                        >
                          {addingSubtask ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Delete Task (admin only) */}
              {isAdmin && (
                <div className="pt-4 border-t border-[#333438]">
                  <button
                    onClick={handleDeleteTask}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Task
                  </button>
                </div>
              )}
            </div>

            {/* ───────── RIGHT PANEL (Comments) ───────── */}
            <div className="w-[340px] shrink-0 flex flex-col bg-[#232426] overflow-hidden">
              {/* Comments header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#333438]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-white">Comments</span>
                </div>
                <div className="flex items-center gap-2 text-[#8a8c91]">
                  <span className="text-[11px]">Created {createdDate}</span>
                  <Search className="h-3.5 w-3.5" />
                  <Bell className="h-3.5 w-3.5" />
                  <span className="text-[11px]">{task.comments?.length ?? 0}</span>
                </div>
              </div>

              {/* Comments list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(!task.comments || task.comments.length === 0) ? (
                  <div className="text-center py-8 space-y-3">
                    <MessageSquare className="h-8 w-8 text-[#333438] mx-auto" />
                    <p className="text-sm font-semibold text-white">Send the first comment</p>
                    <p className="text-xs text-[#8a8c91]">Ask a question, share an update, or loop someone in.</p>
                  </div>
                ) : (
                  task.comments.map(comment => {
                    const isOwner = currentUser?.id === comment.userId;
                    const isEditing = editingCommentId === comment.id;
                    return (
                      <div key={comment.id} className="group">
                        <div className="flex items-start gap-2.5">
                          {comment.user.avatar ? (
                            <Image src={comment.user.avatar} alt="" width={28} height={28} className="rounded-full border border-[#333438] shrink-0" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                              {comment.user.name?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-semibold text-white">{comment.user.name}</span>
                              <span className="text-[10px] text-[#555]">
                                {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isAdmin && isOwner && !isEditing && (
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 ml-auto transition">
                                  <button
                                    onClick={() => { setEditingCommentId(comment.id); setEditCommentText(comment.text); }}
                                    className="p-0.5 text-[#8a8c91] hover:text-white"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="p-0.5 text-[#8a8c91] hover:text-red-400"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                            {isEditing ? (
                              <div className="space-y-1.5">
                                <textarea
                                  value={editCommentText}
                                  onChange={(e) => setEditCommentText(e.target.value)}
                                  className="w-full bg-[#1e1f21] border border-[#333438] rounded p-2 text-xs text-white outline-none resize-none"
                                  rows={2}
                                />
                                <div className="flex gap-1.5">
                                  <button onClick={() => handleEditComment(comment.id)} className="text-[10px] font-semibold text-white bg-indigo-600 px-2 py-0.5 rounded">Save</button>
                                  <button onClick={() => setEditingCommentId(null)} className="text-[10px] font-semibold text-[#8a8c91] px-2 py-0.5 rounded hover:text-white">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-[#ccc] leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Comment input */}
              <div className="border-t border-[#333438] p-3">
                {isAdmin ? (
                  <>
                    <div className="flex items-center gap-2 text-[11px] text-[#8a8c91] mb-2 px-1">
                      <button className="font-semibold text-white border-b border-indigo-500 pb-0.5">Comment</button>
                    </div>
                    <div className="relative">
                      <textarea
                        ref={commentInputRef}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
                        placeholder="Write a comment..."
                        rows={2}
                        className="w-full bg-[#1e1f21] border border-[#333438] rounded-lg p-2.5 pr-10 text-xs text-white outline-none resize-none focus:border-indigo-500 placeholder:text-[#555] transition"
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={postingComment || !newComment.trim()}
                        className="absolute right-2 bottom-2.5 p-1 text-indigo-400 hover:text-indigo-300 disabled:text-[#555] transition"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-[#555] text-center py-2">Read-only view — only admins can comment</p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Confirmation Dialog */}
        {confirmDialog && (
          <div className="absolute inset-0 z-50 flex items-center justify-center" onClick={() => setConfirmDialog(null)}>
            <div className="absolute inset-0 bg-black/50 rounded-xl" />
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-[380px] bg-[#232426] border border-[#333438] rounded-xl shadow-2xl p-5 space-y-4 animate-in fade-in-0 zoom-in-95 duration-150"
            >
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-white">{confirmDialog.title}</h3>
                <p className="text-xs text-[#8a8c91] leading-relaxed">{confirmDialog.message}</p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="px-3 py-1.5 text-xs font-medium text-[#8a8c91] hover:text-white bg-[#2a2b2e] border border-[#333438] rounded-lg hover:border-[#555] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
