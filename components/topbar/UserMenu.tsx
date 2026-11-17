'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Settings,
  Circle,
  Palette,
  FlaskConical,
  HelpCircle,
  Crosshair,
  Briefcase,
  Clock,
  StickyNote,
  VideoIcon,
  Mic,
  AlarmClock,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { useCreateModal } from '@/store/createModalStore';
import { logout } from '@/lib/auth';
import Notepad from '../Notepad';
import ThemeModal from '../ThemeModal';
import AiChatDrawer from '../AiChatDrawer';
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

export default function UserMenu({ onRecordClip, onTalkToText }: { onRecordClip: () => void; onTalkToText: () => void }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [aiChatDrawerOpen, setAiChatDrawerOpen] = useState(false);
  const [notepadOpen, setNotepadOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const confirmLogout = async () => {
    await logout();
    useProjectStore.getState().clear();
    router.replace('/login');
  };

  return (
    <>
      <div className="relative" ref={userMenuRef}>
        <button onClick={() => setUserMenuOpen((o) => !o)} className="flex items-center gap-1.5 rounded hover:bg-(--c-2a2b2e) p-1 transition ml-1">
          {user?.avatar ? (
            <Image src={user.avatar} alt={user.name || 'User'} width={24} height={24} className="h-6 w-6 rounded-full object-cover border border-(--c-333438)" referrerPolicy="no-referrer" />
          ) : (
            <div className="h-6 w-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
        </button>

        {userMenuOpen && (
          <div className="absolute right-0 mt-2 w-75 bg-(--c-1e1f21) border border-(--c-333438) rounded-xl shadow-2xl z-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150 max-h-[85vh] overflow-hidden">
            {/* FIXED HEADER */}
            <div className="p-4 pb-2 shrink-0 border-b border-(--c-333438)">
              <div className="flex items-center gap-3 mb-3">
                {user?.avatar ? (
                  <Image src={user.avatar} alt={user.name || 'User'} width={40} height={40} className="h-10 w-10 rounded-full object-cover border border-(--c-333438)" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-indigo-500 text-white flex items-center justify-center text-lg font-bold">
                    {user?.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-[14px] font-bold text-(--c-white) truncate leading-tight">{user?.name}</h3>
                  <p className="text-[11px] text-[#1bb5a5] flex items-center gap-1 mt-0.5">
                    <Circle className="h-2 w-2 fill-current" /> Online
                  </p>
                </div>
              </div>

              <button className="w-full flex items-center gap-2 px-3 py-2 bg-(--c-2a2b2e) hover:bg-(--c-333438) border border-(--c-333438) rounded-md text-[12px] text-(--c-8a8c91) transition text-left">
                <Circle className="h-3.5 w-3.5" /> Set status
              </button>
            </div>

            {/* SCROLLABLE MIDDLE SECTION */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="px-2 py-2">
                {[
                  { icon: Settings, label: 'Settings', href: '/profile' },
                  { icon: Palette, label: 'Themes', action: 'theme' },
                  { icon: FlaskConical, label: 'ClickUp Labs', href: '/labs' },
                  { icon: HelpCircle, label: 'Help', action: 'help' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (item.action === 'theme') {
                        setUserMenuOpen(false);
                        setThemeModalOpen(true);
                      } else if (item.action === 'help') {
                        setUserMenuOpen(false);
                        setAiChatDrawerOpen(true);
                      } else if (item.href) {
                        setUserMenuOpen(false);
                        router.push(item.href);
                      }
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-(--c-2a2b2e) rounded-md transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-(--c-8a8c91)" />
                      <span className="text-[13px] text-(--c-e5e5e5)">{item.label}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="h-px bg-(--c-333438) w-full" />

              <div className="px-2 py-2">
                <p className="px-2 text-[10px] uppercase tracking-wider font-bold text-(--c-8a8c91) mb-1">Personal Tools</p>
                {[
                  { icon: Crosshair, label: 'Create task', hotkey: 'K', action: 'task' },
                  { icon: Briefcase, label: 'My Work' },
                  { icon: Clock, label: 'Track Time' },
                  { icon: StickyNote, label: 'Notepad', action: 'notepad' },
                  { icon: VideoIcon, label: 'Record a Clip', hotkey: 'R', action: 'record' },
                  { icon: Mic, label: 'Talk to Text', hotkey: 'T', action: 'talk' },
                  { icon: AlarmClock, label: 'Create Reminder', action: 'reminder' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (item.action === 'notepad') {
                        setUserMenuOpen(false);
                        setNotepadOpen(true);
                      } else if (item.action === 'record') {
                        setUserMenuOpen(false);
                        onRecordClip();
                      } else if (item.action === 'talk') {
                        setUserMenuOpen(false);
                        onTalkToText();
                      } else if (item.action === 'task' || item.action === 'reminder') {
                        setUserMenuOpen(false);
                        useCreateModal.getState().openModal(item.action);
                      }
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-(--c-2a2b2e) rounded-md transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-(--c-8a8c91)" />
                      <span className="text-[13px] text-(--c-e5e5e5)">{item.label}</span>
                    </div>
                    {item.hotkey && <span className="text-[10px] text-(--c-8a8c91) bg-(--c-2a2b2e) px-1.5 py-0.5 rounded border border-(--c-333438)">{item.hotkey}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* FIXED FOOTER */}
            <div className="p-2 border-t border-(--c-333438) shrink-0 bg-(--c-1e1f21)">
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  setLogoutDialogOpen(true);
                }}
                className="w-full text-left px-2 py-2 text-[13px] text-red-400 hover:bg-(--c-2a2b2e) hover:text-red-300 rounded-md transition-colors flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODALS & DRAWERS */}
      <ThemeModal open={themeModalOpen} onClose={() => setThemeModalOpen(false)} />
      <Notepad open={notepadOpen} onClose={() => setNotepadOpen(false)} />
      <AiChatDrawer open={aiChatDrawerOpen} onClose={() => setAiChatDrawerOpen(false)} />

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent className="bg-(--c-1e1f21) border-(--c-333438) text-(--c-white)">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
            <AlertDialogDescription className="text-(--c-8a8c91)">
              You will need to sign in again to access your workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-(--c-2a2b2e) border-(--c-333438) text-(--c-white) hover:bg-(--c-333438) hover:text-(--c-white)">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout} className="bg-red-600 hover:bg-red-700 text-white">
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
