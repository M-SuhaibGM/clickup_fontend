'use client';

import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { getSocket } from '@/lib/socket';
import Image from 'next/image';
import { 
  History, ShieldAlert, PlusCircle, Trash2, Edit2, 
  UserPlus, FolderKanban, CheckSquare, List as ListIcon
} from 'lucide-react';

interface Activity {
  id: string;
  action: string;
  entityType: string;
  entityName: string;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null };
}

const ACTION_ICONS: Record<string, any> = {
  created: PlusCircle,
  added: UserPlus,
  updated: Edit2,
  deleted: Trash2,
};

const ENTITY_COLORS: Record<string, string> = {
  project: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10',
  list: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
  task: 'text-orange-500 bg-orange-50 dark:bg-orange-500/10',
  member: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10',
};

export default function HistoryPage() {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!activeWorkspace) return;

    // Check if user is admin (based on role)
    async function checkAdminAndFetch() {
      try {
        const wsRes = await api.get<{ workspace: { members: any[] } }>(`/workspaces/${activeWorkspace!.id}`);
        const me = wsRes.data.workspace.members.find((m: any) => m.userId === wsRes.data.workspace.members[0]?.userId);
        // ^ We'll rely on the backend to enforce this anyway, so just try fetching
        
        const { data } = await api.get<{ activities: Activity[] }>(`/workspaces/${activeWorkspace!.id}/activities`);
        setActivities(data.activities);
        setIsAdmin(true);
      } catch (err: any) {
        if (err?.response?.status === 403) {
          setIsAdmin(false);
        } else {
          toast.error('Failed to load activity');
        }
      } finally {
        setLoading(false);
      }
    }

    checkAdminAndFetch();

    // Join workspace room for live updates
    const socket = getSocket();
    socket.emit('join:workspace', activeWorkspace.id);

    socket.on('activity:logged', (newActivity: Activity) => {
      setActivities((prev) => {
        if (prev.some(a => a.id === newActivity.id)) return prev;
        return [newActivity, ...prev].slice(0, 100);
      });
    });

    return () => {
      socket.emit('leave:workspace', activeWorkspace.id);
      socket.off('activity:logged');
    };
  }, [activeWorkspace]);

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96 mb-6" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4 mt-20">
        <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground">Only workspace admins can view the activity history.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <History className="h-5 sm:h-6 w-5 sm:w-6 text-indigo-500" /> Activity History
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Everything that's happening in <span className="font-semibold text-foreground">{activeWorkspace?.name}</span>.
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-card/50 p-12 text-center">
          <History className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground mt-1">Actions will appear here as they happen.</p>
        </div>
      ) : (
        <div className="relative space-y-1">
          {activities.map((activity, index) => {
            const ActionIcon = ACTION_ICONS[activity.action] || Edit2;
            const entityColor = ENTITY_COLORS[activity.entityType] || ENTITY_COLORS.project;

            return (
              <div key={activity.id} className="flex gap-3 sm:gap-4 group relative">
                {/* Timeline Line */}
                {index !== activities.length - 1 && (
                  <div className="absolute left-4 sm:left-5 top-10 bottom-0 w-px bg-border" aria-hidden />
                )}

                {/* User Avatar */}
                <div className="relative z-10 shrink-0">
                  {activity.user.avatar ? (
                    <Image src={activity.user.avatar} alt={activity.user.name} width={40} height={40} className="h-8 sm:h-10 w-8 sm:w-10 rounded-full border border-border object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="h-8 sm:h-10 w-8 sm:w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm">
                      {activity.user.name[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6 pt-1">
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                    <span className="font-semibold">{activity.user.name}</span>{' '}
                    <span className="text-muted-foreground">{activity.action}</span>{' '}
                    <span className="font-medium">{activity.entityType}</span>{' '}
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">"{activity.entityName}"</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${entityColor}`}>
                      <ActionIcon className="h-3 w-3" />
                      {activity.entityType}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{formatTime(activity.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}