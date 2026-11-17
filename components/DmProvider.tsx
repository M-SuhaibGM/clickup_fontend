'use client';

import { useEffect } from 'react';
import { connectSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { useDmStore, type DirectMessage } from '@/store/dmStore';
import { useWorkspaceStore } from '@/store/workspaceStore';

/**
 * Keeps the workspace member list + unread counts loaded, and listens for
 * real-time direct messages for the whole app. Renders nothing.
 */
export default function DmProvider() {
  const userId = useAuthStore((s) => s.user?.id);
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspace?.id);

  // (Re)load members + unread whenever the workspace changes
  useEffect(() => {
    if (!workspaceId) return;
    const { reset, fetchMembers, fetchSummary } = useDmStore.getState();
    reset();
    fetchMembers(workspaceId);
    fetchSummary(workspaceId);
  }, [workspaceId]);

  // Socket listeners
  useEffect(() => {
    if (!userId || !workspaceId) return;
    const socket = connectSocket();

    const onNew = (message: DirectMessage) => {
      if (message.workspaceId !== workspaceId) return; // message for another workspace
      useDmStore.getState().receive(message, userId);

      // If that chat is open, the user has effectively read it
      const { activeChatUserId, markRead } = useDmStore.getState();
      if (message.senderId === activeChatUserId && message.receiverId === userId) {
        markRead(workspaceId, message.senderId);
      }
    };

    // Re-sync anything missed while the socket was offline
    const onReconnect = () => useDmStore.getState().fetchSummary(workspaceId);

    socket.on('dm:new', onNew);
    socket.io.on('reconnect', onReconnect);
    return () => {
      socket.off('dm:new', onNew);
      socket.io.off('reconnect', onReconnect);
    };
  }, [userId, workspaceId]);

  return null;
}
