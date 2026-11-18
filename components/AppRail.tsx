'use client';

import {
  ChevronsRight,
  Home,
  Calendar,
  Users,
  LayoutGrid,
  FlaskConical,
  UserPlus,
  Grip,
  Orbit,
  MessageSquare,
  FileText,
  BarChart2,
  PenTool,
  CheckSquare,
  Video,
  Trophy,
  Clock,
  Settings
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { lazyOnOpen } from './LazyMount';

const InviteMemberModal = lazyOnOpen(() => import('./InviteMemberModal'));


export default function AppRail({
  isSidebarOpen,
  toggleSidebar
}: {
  isSidebarOpen: boolean;
  toggleSidebar: () => void
}) {
  const [active, setActive] = useState('Home');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const pathname = usePathname();
  const onTeams = pathname === '/teams' || pathname.startsWith('/teams/');

  return (
    <>
      <div className="w-13 shrink-0 h-full flex flex-col items-center py-3 z-50 rounded-lg mb-2 mr-2 relative bg-[#191919]">

        {/* Top Section */}
        <div className="flex flex-col items-center w-full shrink-0">
          <div className={`w-full flex justify-center transition-all duration-300 ${isSidebarOpen ? 'h-0 opacity-0 mb-0' : 'h-10 opacity-100 mb-2'}`}>
            <button onClick={toggleSidebar} className="p-1.5 text-[#FFFFFF] rounded hover:bg-(--c-2a2b2e) transition">
              <ChevronsRight className="h-5 w-5" />
            </button>
          </div>

          {/* Home Link */}
          <RailLink href="/dashboard" label="Home" active={pathname === '/dashboard'}>
            <Home className="h-5 w-5" />
          </RailLink>
          <RailLink href="/planner" label="Planner" active={pathname === '/planner'}>
            <Calendar className="h-5 w-5" />
          </RailLink>
          <RailLink href="/ai" label="AI" active={pathname === '/ai'}>
            <Image src="/ai-icon.png" alt="" width={20} height={20} className="h-5 w-5 object-contain" />
          </RailLink>
          <RailLink href="/teams" label="Teams" active={onTeams}>
            <Users className="h-5 w-5" />
          </RailLink>

          {/* The More Button */}
          <MoreMenu />

        </div>

        <div className="flex-1" />

        {/* Bottom Section */}
        <div className="flex flex-col items-center w-full shrink-0 pb-1">
          <RailLink href="/labs" label="Labs" active={pathname === '/labs'}>
            <FlaskConical className="h-5 w-5" />
          </RailLink>
          <RailItem icon={UserPlus} label="Invite" active={false} onClick={() => setInviteModalOpen(true)} />

          <Link href="/upgrade" className="flex flex-col items-center gap-1 text-(--c-8a8c91) hover:text-(--c-white) transition mt-3 group">
            <span className="text-xl leading-none group-hover:scale-110 transition-transform">🚀</span>
            <span className="text-[10px] font-semibold">Upgrade</span>
          </Link>
        </div>
      </div>

      <InviteMemberModal open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} />
    </>
  );
}

// --- The "More" Menu Component ---
function MoreMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const items = [
    { icon: Orbit, label: 'Spaces', color: 'text-purple-400', bg: 'bg-purple-500/20' },
    { icon: MessageSquare, label: 'Chat', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    { icon: FileText, label: 'Docs', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { icon: BarChart2, label: 'Dashboards', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/20' },
    { icon: PenTool, label: 'Whiteboards', color: 'text-amber-400', bg: 'bg-amber-500/20' },
    { icon: CheckSquare, label: 'Forms', color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
    { icon: Video, label: 'Clips', href: '/clips', color: 'text-red-400', bg: 'bg-red-500/20' },
    { icon: Trophy, label: 'Goals', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    { icon: Clock, label: 'Timesheets', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  ];

  return (
    <div className="relative w-full flex flex-col items-center my-1.5" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex flex-col items-center justify-center gap-1 group w-full`}
      >
        <div className={`relative p-1.5 rounded-lg transition-all duration-200 ${isOpen ? 'text-[#FFFFFF] bg-(--c-2a2b2e)' : 'text-[#FFFFFF] group-hover:bg-(--c-2a2b2e)/50'
          }`}>
          <Grip className={`h-5 w-5 relative z-10`} />
        </div>
        <span className={`text-[10px] font-medium transition-colors ${isOpen ? 'text-(--c-white)' : 'text-(--c-8a8c91) group-hover:text-(--c-white)'}`}>
          More
        </span>
      </button>

      {/* Popover Menu - FIXED TO BOTTOM OF SCREEN */}
      {isOpen && (
        <div className="fixed bottom-4 left-17.5 w-75 bg-(--c-1e1f21) border border-(--c-333438) rounded-xl shadow-2xl p-4 z-999 animate-in fade-in slide-in-from-left-2 duration-200">

          <div className="grid grid-cols-3 gap-y-5 gap-x-2">
            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  if ('href' in item && item.href) {
                    setIsOpen(false);
                    router.push(item.href);
                  }
                }}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${item.bg} group-hover:scale-105 transition-transform`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <span className="text-[11px] font-medium text-(--c-e5e5e5) group-hover:text-(--c-white) transition-colors">
                  {item.label}
                </span>
              </button>
            ))}

            <button className="flex flex-col items-center gap-2 group">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-(--c-2a2b2e) group-hover:scale-105 transition-transform">
                <span className="text-lg">🧩</span>
              </div>
              <span className="text-[11px] font-medium text-(--c-e5e5e5) group-hover:text-(--c-white) transition-colors">
                Apps
              </span>
            </button>
          </div>

          <div className="mt-5 pt-3 border-t border-(--c-333438)">
            <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-(--c-2a2b2e) text-(--c-e5e5e5) text-[12px] font-medium transition">
              <Settings className="h-3.5 w-3.5" /> Customize navigation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Colour that hugs the badge's edge: blue (left) → purple (top) → magenta / orange (bottom) → back to blue
const EDGE_GLOW =
  'conic-gradient(from 205deg, #2f7bff 0deg, #6a5cff 65deg, #c04bff 125deg, #ff4fa3 200deg, #ff8a3d 245deg, #ff4fa3 285deg, #3b82f6 360deg)';

/**
 * The icon's round badge. Inactive: plain, with a soft hover. Active: a dark disc whose edge glows with the
 * gradient above and fades into the dark centre, plus a soft halo around it. The icon stays white.
 */
function RailBadge({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 ${
        active ? 'text-[#FFFFFF]' : 'text-[#FFFFFF] group-hover:bg-(--c-2a2b2e)'
      }`}
      style={
        active
          ? { background: `radial-gradient(circle at 50% 50%, #0d0d10 0%, #0d0d10 46%, rgba(13,13,16,0) 80%), ${EDGE_GLOW}` }
          : undefined
      }
    >
      {active && <span aria-hidden className="absolute inset-0 -z-10 rounded-full opacity-55 blur-md" style={{ background: EDGE_GLOW }} />}
      {children}
    </div>
  );
}

const railLabel = (active: boolean) =>
  `text-[10px] font-medium transition-colors ${active ? 'text-(--c-white)' : 'text-(--c-8a8c91) group-hover:text-(--c-white)'}`;

function RailLink({ href, label, active, children }: { href: string; label: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} aria-current={active ? 'page' : undefined} className="flex flex-col items-center justify-center gap-1 group w-full my-1.5">
      <RailBadge active={active}>{children}</RailBadge>
      <span className={railLabel(active)}>{label}</span>
    </Link>
  );
}

function RailItem({ icon: Icon, label, active, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-1 group w-full my-1.5">
      <RailBadge active={active}><Icon className="h-5 w-5" /></RailBadge>
      <span className={railLabel(active)}>{label}</span>
    </button>
  );
}
