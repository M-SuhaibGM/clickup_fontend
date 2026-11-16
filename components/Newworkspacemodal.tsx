// components/NewWorkspaceModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useUserStore } from '@/store/userStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  Loader2,
  Building2,
  X,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  User,
  GraduationCap,
  Code,
  Rocket,
  Palette,
  Monitor,
  Settings,
  TrendingUp,
  Headphones,
  Users,
  Megaphone,
  Heart,
  BarChart3,
  Award,
  DollarSign,
  MoreHorizontal,
  Mail,
} from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const MAX_LENGTH = 50;

type Step = 'name' | 'purpose' | 'manage' | 'invite';

const PURPOSE_OPTIONS = [
  { label: 'Work', icon: Briefcase },
  { label: 'Personal', icon: User },
  { label: 'School', icon: GraduationCap },
] as const;

const MANAGE_OPTIONS = [
  { label: 'Software Development', icon: Code },
  { label: 'Startup', icon: Rocket },
  { label: 'Creative & Design', icon: Palette },
  { label: 'IT', icon: Monitor },
  { label: 'Operations', icon: Settings },
  { label: 'Sales & CRM', icon: TrendingUp },
  { label: 'Support', icon: Headphones },
  { label: 'HR & Recruiting', icon: Users },
  { label: 'Marketing', icon: Megaphone },
  { label: 'Personal Use', icon: Heart },
  { label: 'PMO', icon: BarChart3 },
  { label: 'Professional Services', icon: Award },
  { label: 'Finance & Accounting', icon: DollarSign },
  { label: 'Other', icon: MoreHorizontal },
] as const;

const STEPS: Step[] = ['name', 'purpose', 'manage', 'invite'];

export default function NewWorkspaceModal({ open, onClose }: Props) {
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const fetchUsers = useUserStore((s) => s.fetchUsers);

  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [manage, setManage] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [createdWorkspaceId, setCreatedWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep('name');
      setName('');
      setPurpose('');
      setManage('');
      setInviteEmail('');
      setCreating(false);
      setInviting(false);
      setCreatedWorkspaceId(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !creating && !inviting) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, creating, inviting, onClose]);

  if (!open) return null;

  const trimmed = name.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < 2;
  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const goBack = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const handleNameNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (trimmed.length >= 2) setStep('purpose');
  };

  const handlePurposeSelect = (value: string) => {
    setPurpose(value);
    setStep('manage');
  };

  const handleManageSelect = async (value: string) => {
    setManage(value);
    setCreating(true);
    try {
      const ws = await createWorkspace(trimmed);
      setCreatedWorkspaceId(ws.id);
      setStep('invite');
    } catch {
      // toast is handled by the store
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !createdWorkspaceId) return;

    setInviting(true);
    try {
      const { data } = await api.post(`/workspaces/${createdWorkspaceId}/members`, {
        email: inviteEmail.trim(),
      });
      toast.success(`${data.user.name} was added to the workspace!`);
      await fetchUsers(createdWorkspaceId);
      setInviteEmail('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to add member');
    } finally {
      setInviting(false);
    }
  };

  const handleFinish = () => {
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4"
      onClick={() => !creating && !inviting && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-workspace-title"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '70vw', height: '70vh', maxWidth: '70vw' }}
        className="flex flex-col rounded-2xl bg-card shadow-2xl border border-border overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <Image src="/icon.png" alt="ClickUp" width={28} height={28} />
            <h2 id="new-workspace-title" className="text-lg font-bold text-foreground">
              ClickUp
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent transition disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center px-8 py-6 overflow-y-auto">
          {/* Step 1: Workspace Name */}
          {step === 'name' && (
            <form onSubmit={handleNameNext} className="space-y-5">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-1">
                  Create a new Workspace
                </h3>
                <p className="text-sm text-muted-foreground">
                  A workspace holds your projects, lists and team members.
                </p>
              </div>

              <div>
                <label
                  htmlFor="workspace-name"
                  className="block text-[13px] font-semibold text-foreground mb-1.5"
                >
                  Workspace Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="workspace-name"
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={MAX_LENGTH}
                    placeholder="e.g. Acme Marketing"
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition"
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className={`text-xs ${tooShort ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {tooShort ? 'Name must be at least 2 characters.' : 'You will be the owner of this workspace.'}
                  </p>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {name.length}/{MAX_LENGTH}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={trimmed.length < 2}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* Step 2: Purpose */}
          {step === 'purpose' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-foreground">
                What will you use this Workspace for?
              </h3>

              <div className="flex gap-4">
                {PURPOSE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = purpose === opt.label;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => handlePurposeSelect(opt.label)}
                      className={`flex-1 flex flex-col items-center gap-3 py-7 px-6 rounded-xl border-2 text-base font-medium transition-all ${
                        selected
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          : 'border-border hover:border-indigo-300 hover:bg-accent text-foreground'
                      }`}
                    >
                      <Icon className="h-7 w-7" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: What to manage */}
          {step === 'manage' && !creating && (
            <div className="space-y-5">
              <h3 className="text-2xl font-bold text-foreground">
                What would you like to manage?
              </h3>

              <div className="flex flex-wrap gap-2.5">
                {MANAGE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = manage === opt.label;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => handleManageSelect(opt.label)}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${
                        selected
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          : 'border-border hover:border-indigo-300 hover:bg-accent text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Creating spinner overlay */}
          {step === 'manage' && creating && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              <p className="text-sm text-muted-foreground">Creating your workspace...</p>
            </div>
          )}

          {/* Step 4: Invite */}
          {step === 'invite' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-2xl font-bold text-foreground">
                  Invite people to your Workspace:
                </h3>
              </div>

              <form onSubmit={handleInvite}>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    autoFocus
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email addresses (or paste multiple)"
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition"
                  />
                </div>
                <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                    Don&apos;t do it alone - Invite your team to get started 200% faster.
                  </span>
                </div>
                {inviteEmail.trim() && (
                  <button
                    type="submit"
                    disabled={inviting}
                    className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition"
                  >
                    {inviting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Member'
                    )}
                  </button>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Footer with progress and navigation */}
        <div className="px-8 pb-6 shrink-0">
          {/* Progress bar */}
          <div className="h-1 w-full bg-border rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              {stepIndex > 0 && step !== 'name' && (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={creating || inviting || step === 'invite'}
                  className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-indigo-500 disabled:opacity-50 transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              )}
            </div>
            <div>
              {step === 'invite' && (
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={inviting}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {step === 'invite' && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Keep in mind info can&apos;t be transferred across Workspaces.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
