'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTaskStore } from '@/store/taskStore';
import { useUserStore } from '@/store/userStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { Task } from '@/types/task';
import { api } from '@/lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UploadDropzone } from "@/lib/uploadthing"; // ← Changed to Dropzone
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowLeft,
  Calendar,
  User as UserIcon,
  Flag,
  CheckCircle2,
  ListTodo,
  MessageSquare,
  Paperclip,
  Plus,
  Search,
  Check,
  ChevronDown,
  Lock,
  FileText,
  X
} from 'lucide-react';

const STATUSES = [
  { value: 'TODO', label: 'To Do', color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
  { value: 'DONE', label: 'Done', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low', color: 'text-zinc-500' },
  { value: 'NORMAL', label: 'Normal', color: 'text-blue-500' },
  { value: 'HIGH', label: 'High', color: 'text-amber-500' },
  { value: 'URGENT', label: 'Urgent', color: 'text-rose-500' },
];

export default function TaskPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  // Stores
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const users = useUserStore((s) => s.users);
  const fetchUsers = useUserStore((s) => s.fetchUsers);
  const currentUser = useAuthStore((s) => s.user);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);

  // State
  const [task, setTask] = useState<Task | null>(null);
  const [loadingTask, setLoadingTask] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [listId, setListId] = useState<string>('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('TODO');
  const [priority, setPriority] = useState('NORMAL');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]); // ← New
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [deletingComment, setDeletingComment] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);

  // Init: Fetch task & check role
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingTask(true);
        const { data } = await api.get<{ task: Task }>(`/tasks/${id}`);
        setTask(data.task);
        setListId(data.task.listId);
        
        setTitle(data.task.title);
        setDescription(data.task.description ?? '');
        setStatus(data.task.status);
        setPriority(data.task.priority);
        setDueDate(data.task.dueDate ? data.task.dueDate.slice(0, 10) : '');
        setAssigneeId(data.task.assigneeId ?? '');
        setAttachments(data.task.attachments || []); // ← New

        // Fetch workspace users & role
        if (activeWorkspace) {
          fetchUsers(activeWorkspace.id);
          const wsData = await api.get<{ workspace: { members: any[] } }>(`/workspaces/${activeWorkspace.id}`);
          const me = wsData.data.workspace.members.find((m) => m.userId === currentUser?.id);
          setIsAdmin(me?.role === 'ADMIN');
        }
      } catch (err) {
        toast.error('Task not found');
        router.push('/dashboard');
      } finally {
        setLoadingTask(false);
      }
    }
    if (id && currentUser && activeWorkspace) loadData();
  }, [id, currentUser, activeWorkspace, fetchUsers, router]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(e.target as Node)) {
        setAssigneeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (loadingTask) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!task) return null;

  const handleSave = async () => {
    if (!isAdmin) return toast.error('Only admins can edit task details');
    setSaving(true);
    try {
      await updateTask(task.id, listId, {
        title: title.trim(),
        description: description.trim() || null,
        status: status as any,
        priority: priority as any,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        assigneeId: assigneeId || null,
      });
      toast.success('Task updated');
    } catch {
      toast.error('Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) return toast.error('Only admins can delete tasks');
    try {
      await deleteTask(task.id, listId);
      toast.success('Task deleted');
      router.push('/dashboard');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || postingComment) return;
    const textToSubmit = newComment.trim();
    setNewComment('');
    setPostingComment(true);
    
    setTask(prev => prev ? { ...prev, comments: [...(prev.comments ?? []), { id: 'temp', taskId: prev.id, text: textToSubmit, createdAt: new Date().toISOString(), userId: currentUser?.id ?? '', user: { id: currentUser?.id ?? '', name: currentUser?.name ?? 'You', avatar: currentUser?.avatar ?? null } }] } : prev);

    try {
      await api.post(`/tasks/${task.id}/comments`, { text: textToSubmit });
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

  const handleToggleSubtask = async (subtask: Task) => {
    const newStatus = subtask.status === 'DONE' ? 'TODO' : 'DONE';
    setTask(prev => prev ? { ...prev, subtasks: prev.subtasks?.map(st => st.id === subtask.id ? { ...st, status: newStatus } : st) } : prev);

    try {
      await api.patch(`/tasks/${subtask.id}`, { status: newStatus });
    } catch {
      toast.error('Failed to update subtask');
    }
  };

  const handleAddSubtask = async () => {
    if (!isAdmin) return toast.error('Only admins can add subtasks');
    if (!newSubtask.trim() || addingSubtask) return;
    setAddingSubtask(true);
    try {
      const { data } = await api.post<{ task: Task }>(`/lists/${listId}/tasks`, {
        title: newSubtask.trim(),
        parentId: task.id,
      });
      setTask(prev => prev ? { ...prev, subtasks: [...(prev.subtasks ?? []), data.task] } : prev);
      setNewSubtask('');
      toast.success('Subtask added');
    } catch {
      toast.error('Failed to add subtask');
    } finally {
      setAddingSubtask(false);
    }
  };

  // ← NEW: Handle file uploads
  const handleFileUpload = async (uploadedFiles: { url: string }[]) => {
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

  // ← NEW: Handle file removal
  const handleRemoveFile = async (urlToRemove: string) => {
    const newUrls = attachments.filter(url => url !== urlToRemove);
    setAttachments(newUrls);
    
    try {
      await updateTask(task.id, listId, { attachments: newUrls });
      toast.success('File removed');
    } catch {
      toast.error('Failed to remove file');
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(assigneeSearchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(assigneeSearchQuery.toLowerCase())
  );
  const selectedAssignee = users.find((u) => u.id === assigneeId);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      
      {/* Header / Back Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        {isAdmin ? (
          <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            Admin Access
          </span>
        ) : (
          <span className="text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <Lock className="h-3 w-3" /> View Only
          </span>
        )}
      </div>

      {/* Main Task Card */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        
        {/* Header Section */}
        <div className="p-6 border-b border-border/60 space-y-4">
          <div className="flex items-start gap-4">
            <button 
              onClick={() => isAdmin && handleSave()}
              disabled={!isAdmin || saving}
              className={`mt-1 h-5 w-5 rounded-full shrink-0 flex items-center justify-center border-2 transition ${status === 'DONE' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/40 text-transparent hover:border-indigo-500'}`}
            >
              <Check className="h-3 w-3" />
            </button>
            <div className="flex-1">
              {isAdmin ? (
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSave}
                  className="w-full text-2xl font-bold text-foreground bg-transparent border-0 border-b-2 border-transparent focus:border-indigo-500 px-0 py-1 outline-none transition"
                />
              ) : (
                <h1 className={`text-2xl font-bold ${status === 'DONE' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{title}</h1>
              )}
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Status</label>
              <select disabled={!isAdmin} value={status} onChange={(e) => setStatus(e.target.value)} className="w-full text-xs font-medium bg-background border border-input rounded-md px-2 py-1.5 outline-none disabled:opacity-60">
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Flag className="h-3 w-3" /> Priority</label>
              <select disabled={!isAdmin} value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full text-xs font-medium bg-background border border-input rounded-md px-2 py-1.5 outline-none disabled:opacity-60">
                {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            
            {/* Assignee */}
            <div className="space-y-1 relative" ref={assigneeDropdownRef}>
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><UserIcon className="h-3 w-3" /> Assignee</label>
              {isAdmin ? (
                <>
                  <button type="button" onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)} className="w-full flex items-center justify-between text-xs font-medium bg-background border border-input rounded-md px-2.5 py-1.5 outline-none text-left">
                    <span className="truncate">{selectedAssignee ? selectedAssignee.name : 'Unassigned'}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>
                  {assigneeDropdownOpen && (
                    <div className="absolute top-full mt-1 left-0 w-64 bg-popover border border-border rounded-lg shadow-xl z-50 p-2 space-y-2">
                      <input autoFocus value={assigneeSearchQuery} onChange={(e) => setAssigneeSearchQuery(e.target.value)} placeholder="Search..." className="w-full border border-input rounded-md px-2 py-1 text-xs outline-none" />
                      <div className="max-h-40 overflow-y-auto space-y-0.5">
                        <button onClick={() => { setAssigneeId(''); setAssigneeDropdownOpen(false); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted rounded">Unassigned</button>
                        {filteredUsers.map(u => (
                          <button key={u.id} onClick={() => { setAssigneeId(u.id); setAssigneeDropdownOpen(false); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted rounded">
                            <p className="font-medium truncate">{u.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs font-medium bg-muted/50 border border-transparent rounded-md px-2 py-1.5 text-foreground truncate">
                  {selectedAssignee ? selectedAssignee.name : 'Unassigned'}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Calendar className="h-3 w-3" /> Due Date</label>
              <input type="date" disabled={!isAdmin} value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full text-xs font-medium bg-background border border-input rounded-md px-2 py-1.5 outline-none disabled:opacity-60" />
            </div>
          </div>
        </div>

        {/* Body Section */}
        <div className="p-6 space-y-8">
          
          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Description</h3>
            <textarea
              disabled={!isAdmin}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-input bg-background/50 p-3 text-sm focus:border-indigo-500 outline-none resize-none transition disabled:opacity-70 disabled:cursor-not-allowed"
            />
          </div>

          {/* Subtasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-indigo-500" /> Subtasks
              </h3>
              {task.subtasks && task.subtasks.length > 0 && (
                <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                  {task.subtasks.filter((st) => st.status === 'DONE').length} / {task.subtasks.length} Completed
                </span>
              )}
            </div>
            <div className="space-y-2">
              {task.subtasks?.map((st) => (
                <div key={st.id} className="flex items-center gap-2.5 bg-muted/40 border border-border/50 px-3 py-2 rounded-lg">
                  <input type="checkbox" checked={st.status === 'DONE'} onChange={() => handleToggleSubtask(st)} className="h-4 w-4 rounded border-input text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                  <span className={`text-sm font-medium flex-1 ${st.status === 'DONE' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{st.title}</span>
                </div>
              ))}
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2 pt-1">
                <input value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubtask(); }} placeholder="Add a new subtask..." disabled={addingSubtask} className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-indigo-500" />
                <button onClick={handleAddSubtask} disabled={addingSubtask || !newSubtask.trim()} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-semibold disabled:opacity-50 transition">
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
            )}
          </div>

          {/* Attachments - UPDATED */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-indigo-500" /> Attachments
            </h3>

            {/* File List */}
            {attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map((url, i) => {
                  const filename = url.split('/').pop()?.split('-').pop() || 'File';
                  return (
                    <div key={i} className="flex items-center justify-between bg-muted/40 border border-border/50 p-2.5 rounded-lg group">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-foreground hover:text-indigo-600 truncate flex-1">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{filename}</span>
                      </a>
                      {isAdmin && (
                        <button onClick={() => handleRemoveFile(url)} className="text-muted-foreground hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No files attached yet.</p>
            )}

            {/* Upload Dropzone (Admin Only) */}
            {isAdmin && (
              <div className="rounded-xl border-2 border-dashed border-border bg-card/40">
                <UploadDropzone
                  endpoint="taskAttachment"
                  onClientUploadComplete={(res) => {
                    if (res) handleFileUpload(res.map(r => ({ url: r.ufsUrl })));
                  }}
                  onUploadError={(error: Error) => { toast.error(`Upload failed: ${error.message}`); }}
                  appearance={{
                    container: "border-0 bg-transparent p-2",
                    button: "bg-indigo-600 text-white text-xs h-8 px-3 rounded-md after:bg-indigo-700 ut-uploading:bg-indigo-700/50",
                    label: "text-xs text-muted-foreground hover:text-indigo-500",
                    allowedContent: "text-[10px] text-muted-foreground mt-1",
                  }}
                />
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="space-y-4 pt-4 border-t border-border/60">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-500" /> Activity & Comments
            </h3>
            <div className="space-y-4">
              {task.comments?.map((comment) => {
                const isOwner = currentUser?.id === comment.userId;
                const isEditing = editingCommentId === comment.id;
                return (
                  <div key={comment.id} className="flex gap-3 text-sm">
                    {comment.user.avatar ? (
                      <Image src={comment.user.avatar} alt="" width={32} height={32} className="h-8 w-8 rounded-full border border-border object-cover shrink-0" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">{comment.user.name?.[0]?.toUpperCase()}</div>
                    )}
                    <div className="flex-1 bg-muted/40 border border-border/50 p-3 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-foreground text-xs">{comment.user.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isOwner && !isEditing && (
                            <DropdownMenu>
                              <DropdownMenuTrigger className="text-muted-foreground hover:text-foreground outline-none"><MoreHorizontal className="h-3.5 w-3.5" /></DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-28 text-xs">
                                <DropdownMenuItem onClick={() => { setEditingCommentId(comment.id); setEditCommentText(comment.text); }}><Pencil className="h-3 w-3 mr-1.5" /> Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setCommentToDelete(comment.id)} className="text-red-600"><Trash2 className="h-3 w-3 mr-1.5" /> Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      {isEditing ? (
                        <div className="mt-2 space-y-2">
                          <textarea value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} className="w-full rounded-lg border border-input bg-background p-2 text-xs outline-none" rows={2} />
                          <div className="flex gap-2">
                            <button onClick={() => { api.patch(`/tasks/comments/${comment.id}`, { text: editCommentText }); setEditingCommentId(null); toast.success('Comment updated'); }} className="text-xs font-semibold text-white bg-indigo-600 px-2 py-1 rounded">Save</button>
                            <button onClick={() => setEditingCommentId(null)} className="text-xs font-semibold text-foreground px-2 py-1 rounded hover:bg-accent">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-foreground text-xs leading-relaxed">{comment.text}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Add Comment */}
            <div className="flex items-start gap-2 pt-2">
              <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." rows={2} className="flex-1 rounded-xl border border-input bg-background p-3 text-xs focus:border-indigo-500 outline-none resize-none" />
              <button onClick={handleAddComment} disabled={postingComment || !newComment.trim()} className="rounded-xl bg-indigo-600 text-white px-4 py-2.5 text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50">
                {postingComment ? 'Sending...' : 'Post'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions (Admin Only) */}
        {isAdmin && (
          <div className="px-6 py-4 border-t border-border/60 bg-muted/10 flex items-center justify-between">
            <button onClick={() => setConfirmDelete(true)} className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1">
              <Trash2 className="h-3.5 w-3.5" /> Delete Task
            </button>
            <button onClick={handleSave} disabled={saving || !title.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete "{task.title}" and all its subtasks and comments.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}