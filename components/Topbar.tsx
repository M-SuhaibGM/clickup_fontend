'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { logout } from '@/lib/auth';
import Image from 'next/image';
import { ThemeToggle } from './theme-toggle';
import NewWorkspaceModal from './Newworkspacemodal';
import {
  Menu,
  Search,
  Video,
  Settings,
  Bell,
  ChevronDown,
  Check,
  Plus,
  Users,
  LayoutGrid,
  FileText,
  Edit3,
  Bot,
  Tag,
  Circle,
  VolumeX,
  BellRing,
  Palette,
  FlaskConical,
  Command,
  Download,
  HelpCircle,
  Crosshair,
  Briefcase,
  Clock,
  StickyNote,
  VideoIcon,
  Mic,
  AlarmClock,
  ExternalLink,
  ChevronRight,
  LogOut,
  Link
} from 'lucide-react';

export default function Topbar({ onMenuClick, onAiChatClick }: { onMenuClick?: () => void; onAiChatClick?: () => void }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspaceStore();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [wsMenuOpen, setWsMenuOpen] = useState(false);
  const [wsModalOpen, setWsModalOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const wsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (wsMenuRef.current && !wsMenuRef.current.contains(e.target as Node)) setWsMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    useProjectStore.getState().clear();
    router.replace('/login');
  };

  const triggerSearch = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };

  const getInitials = (name?: string) => {
    if (!name) return 'W';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="h-12 shrink-0 bg-[#1e1f21] flex items-center justify-between px-3 text-[#e5e5e5] select-none z-50">

        {/* LEFT: Workspace Switcher */}
        <div className="flex items-center gap-2 flex-1">
          <button onClick={onMenuClick} className="md:hidden p-1.5 hover:bg-[#2a2b2e] rounded text-[#8a8c91] hover:text-white transition">
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative" ref={wsMenuRef}>
            <button
              onClick={() => setWsMenuOpen(!wsMenuOpen)}
              className="flex items-center gap-2 hover:bg-[#2a2b2e] px-2 py-1.5 rounded transition-colors"
            >
              <div className="h-6 w-6 rounded bg-[#1bb5a5] text-white flex items-center justify-center text-[11px] font-bold">
                {getInitials(activeWorkspace?.name)}
              </div>
              <span className="text-[13px] font-semibold text-white hidden sm:block max-w-37.5 truncate">
                {activeWorkspace?.name || 'Select Workspace'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-[#8a8c91]" />
            </button>

            {/* Workspace Dropdown (Kept from previous step) */}
            {wsMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-[320px] bg-[#1e1f21] border border-[#333438] rounded-xl shadow-2xl z-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {/* ... Workspace Dropdown Content ... */}
                <div className="p-4 pb-3">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-[#1bb5a5] text-white flex items-center justify-center text-lg font-bold shrink-0">
                      {getInitials(activeWorkspace?.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-bold text-white truncate leading-tight">
                        {activeWorkspace?.name}
                      </h3>
                      <p className="text-[11px] text-[#8a8c91] mt-0.5">
                        Free Forever · <span className="underline cursor-pointer hover:text-white transition">Upgrade</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href="/settings"
                      className="flex-1 flex items-center justify-center gap-2 h-8 bg-[#2a2b2e] hover:bg-[#333438] border border-[#333438] rounded-md text-[12px] font-medium transition text-[#e5e5e5]"
                    >
                      <Settings className="h-3.5 w-3.5 text-[#8a8c91]" /> Settings
                    </Link>

                    <Link
                      href="/members"
                      className="flex-1 flex items-center justify-center gap-2 h-8 bg-[#2a2b2e] hover:bg-[#333438] border border-[#333438] rounded-md text-[12px] font-medium transition text-[#e5e5e5]"
                    >
                      <Users className="h-3.5 w-3.5 text-[#8a8c91]" /> People
                    </Link>
                  </div>
                </div>
                <div className="h-px bg-[#333438] w-full" />
                <div className="px-2 py-2">
                  <p className="px-2 text-[10px] uppercase tracking-wider font-bold text-[#8a8c91] mb-1">Manage</p>
                  {[{ icon: LayoutGrid, label: 'Apps', color: 'text-pink-500' }, { icon: FileText, label: 'Templates', color: 'text-blue-500' }, { icon: Edit3, label: 'Custom Fields', color: 'text-emerald-500' }, { icon: Bot, label: 'Automations', color: 'text-amber-500' }, { icon: Tag, label: 'Tag Manager', color: 'text-purple-500' }].map((item) => (
                    <button key={item.label} className="w-full flex items-center gap-3 px-2 py-1.5 hover:bg-[#2a2b2e] rounded-md transition-colors group"><item.icon className={`h-4 w-4 ${item.color}`} /><span className="text-[13px] text-[#e5e5e5] group-hover:text-white transition-colors">{item.label}</span></button>
                  ))}
                </div>
                <div className="h-px bg-[#333438] w-full" />
                <div className="px-2 py-2">
                  <p className="px-2 text-[10px] uppercase tracking-wider font-bold text-[#8a8c91] mb-1">Your Workspaces</p>
                  <div className="max-h-40 overflow-y-auto">
                    {workspaces.map((ws) => (
                      <button key={ws.id} onClick={() => { setActiveWorkspace(ws); setWsMenuOpen(false); }} className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-[#2a2b2e] rounded-md transition-colors">
                        <div className="flex items-center gap-3 min-w-0"><div className="h-5 w-5 rounded bg-[#333438] text-white flex items-center justify-center text-[9px] font-bold shrink-0">{getInitials(ws.name)}</div><span className="text-[13px] text-[#e5e5e5] truncate">{ws.name}</span></div>
                        {activeWorkspace?.id === ws.id && <Check className="h-3.5 w-3.5 text-[#2c82f8]" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-px bg-[#333438] w-full" />
                <div className="p-2">
                  <button onClick={() => { setWsMenuOpen(false); setWsModalOpen(true); }} className="w-full flex items-center justify-center gap-2 h-9 bg-transparent hover:bg-[#2a2b2e] border border-[#333438] rounded-md text-[13px] font-medium text-[#e5e5e5] transition"><Plus className="h-4 w-4 text-[#8a8c91]" /> Create Workspace</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CENTER: Global Search Bar (ClickUp Style) */}
        <div className="flex-1 flex justify-center hidden md:flex">
          <div onClick={triggerSearch} className="flex items-center w-full max-w-[440px] bg-[#2a2b2e] border border-[#333438] hover:border-[#444548] rounded-full h-8 pl-3 pr-1 transition-colors cursor-text group">
            <Search className="h-3.5 w-3.5 text-[#8a8c91] mr-2 shrink-0" />
            <span className="text-[13px] text-[#8a8c91] flex-1">Search</span>
            <kbd className="text-[10px] font-sans text-[#8a8c91] bg-transparent border border-[#333438] px-1.5 py-0.5 rounded mr-1 group-hover:border-[#444548] transition-colors">⌘ K</kbd>
            <button onClick={(e) => { e.stopPropagation(); onAiChatClick?.(); }} className="ai-gradient-btn flex items-center gap-1.5 px-2.5 py-0.5 bg-[#2a2b2e] text-white shrink-0 ml-1 h-6">
              <span className="text-[12px] font-medium tracking-wide text-[#e5e5e5]">AI Chats</span>
              <img src="/ai-icon.png" alt="AI" className="ai-icon h-4 w-4 object-contain" />
            </button>
          </div>
        </div>

        {/* RIGHT: Actions & Profile */}
        <div className="flex items-center justify-end gap-1.5 flex-1">
          <button className="p-1.5 text-[#8a8c91] hover:text-white hover:bg-[#2a2b2e] rounded transition"><Video className="h-4 w-4" /></button>
          <button className="p-1.5 text-[#8a8c91] hover:text-white hover:bg-[#2a2b2e] rounded transition"><Bell className="h-4 w-4" /></button>
          <button className="p-1.5 text-[#8a8c91] hover:text-white hover:bg-[#2a2b2e] rounded transition"><Settings className="h-4 w-4" /></button>

          <div className="ml-1"><ThemeToggle /></div>
          <div className="h-4 w-px bg-[#333438] mx-1" />

          {/* ─── USER ACTION MENU ─── */}
          <div className="relative" ref={userMenuRef}>
            <button onClick={() => setUserMenuOpen((o) => !o)} className="flex items-center gap-1.5 rounded hover:bg-[#2a2b2e] p-1 transition ml-1">
              {user?.avatar ? (
                <Image src={user.avatar} alt={user.name || 'User'} width={24} height={24} className="h-6 w-6 rounded-full object-cover border border-[#333438]" referrerPolicy="no-referrer" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
                  {user?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
            </button>

            {userMenuOpen && (
              // Changed to flex-col to handle fixed header/footer and scrollable middle
              <div className="absolute right-0 mt-2 w-[300px] bg-[#1e1f21] border border-[#333438] rounded-xl shadow-2xl z-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150 max-h-[85vh] overflow-hidden">

                {/* 1. FIXED HEADER (Profile & Set Status) */}
                <div className="p-4 pb-2 shrink-0 border-b border-[#333438]">
                  <div className="flex items-center gap-3 mb-3">
                    {user?.avatar ? (
                      <Image src={user.avatar} alt={user.name || 'User'} width={40} height={40} className="h-10 w-10 rounded-full object-cover border border-[#333438]" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-indigo-500 text-white flex items-center justify-center text-lg font-bold">
                        {user?.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-[14px] font-bold text-white truncate leading-tight">{user?.name}</h3>
                      <p className="text-[11px] text-[#1bb5a5] flex items-center gap-1 mt-0.5">
                        <Circle className="h-2 w-2 fill-current" /> Online
                      </p>
                    </div>
                  </div>

                  <button className="w-full flex items-center gap-2 px-3 py-2 bg-[#2a2b2e] hover:bg-[#333438] border border-[#333438] rounded-md text-[12px] text-[#8a8c91] transition text-left">
                    <Circle className="h-3.5 w-3.5" /> Set status
                  </button>
                </div>

                {/* 2. SCROLLABLE MIDDLE SECTION */}
                {/* custom-scrollbar class added to keep it looking thin and dark */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">

                  {/* Main Menu Items */}
                  <div className="px-2 py-2">
                    <button className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-[#2a2b2e] rounded-md transition-colors group">
                      <div className="flex items-center gap-3"><VolumeX className="h-4 w-4 text-[#8a8c91]" /><span className="text-[13px] text-[#e5e5e5]">Mute notifications</span></div>
                      <ChevronRight className="h-3.5 w-3.5 text-[#8a8c91]" />
                    </button>

                    <div className="my-1 border-t border-[#333438]/50 mx-2" />

                    {[
                      { icon: Settings, label: 'Settings' },
                      { icon: BellRing, label: 'Notifications' },
                      { icon: Palette, label: 'Themes' },
                      { icon: FlaskConical, label: 'ClickUp Labs' },
                      { icon: Command, label: 'Keyboard shortcuts' },
                      { icon: Download, label: 'Download ClickUp', hasExternal: true },
                      { icon: HelpCircle, label: 'Help', hasHotkey: true },
                    ].map((item) => (
                      <button key={item.label} className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-[#2a2b2e] rounded-md transition-colors group">
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 text-[#8a8c91]" />
                          <span className="text-[13px] text-[#e5e5e5]">{item.label}</span>
                        </div>
                        {item.hasExternal && <ExternalLink className="h-3.5 w-3.5 text-[#8a8c91]" />}
                        {item.hasHotkey && <Command className="h-3.5 w-3.5 text-[#8a8c91]" />}
                      </button>
                    ))}
                  </div>

                  <div className="h-px bg-[#333438] w-full" />

                  {/* Personal Tools */}
                  <div className="px-2 py-2">
                    <p className="px-2 text-[10px] uppercase tracking-wider font-bold text-[#8a8c91] mb-1">Personal Tools</p>
                    {[
                      { icon: Crosshair, label: 'Create task', hotkey: 'K' },
                      { icon: Briefcase, label: 'My Work' },
                      { icon: Clock, label: 'Track Time' },
                      { icon: StickyNote, label: 'Notepad' },
                      { icon: VideoIcon, label: 'Record a Clip', hotkey: 'R' },
                      { icon: Mic, label: 'Talk to Text', hotkey: 'T' },
                      { icon: AlarmClock, label: 'Create Reminder' },
                    ].map((item) => (
                      <button key={item.label} className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-[#2a2b2e] rounded-md transition-colors group">
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 text-[#8a8c91]" />
                          <span className="text-[13px] text-[#e5e5e5]">{item.label}</span>
                        </div>
                        {item.hotkey && <span className="text-[10px] text-[#8a8c91] bg-[#2a2b2e] px-1.5 py-0.5 rounded border border-[#333438]">{item.hotkey}</span>}
                      </button>
                    ))}
                  </div>

                </div>

                {/* 3. FIXED FOOTER (Sign Out) */}
                <div className="p-2 border-t border-[#333438] shrink-0 bg-[#1e1f21]">
                  <button onClick={handleLogout} className="w-full text-left px-2 py-2 text-[13px] text-red-400 hover:bg-[#2a2b2e] hover:text-red-300 rounded-md transition-colors flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      </header>

      <NewWorkspaceModal open={wsModalOpen} onClose={() => setWsModalOpen(false)} />
    </>
  );
}