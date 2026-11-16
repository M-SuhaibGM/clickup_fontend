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
import { usePathname } from 'next/navigation';
import InviteMemberModal from './InviteMemberModal';

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

  return (
    <>
      <div className="w-13 shrink-0 h-full flex flex-col items-center py-3 z-50  dark:bg-[#232426]   rounded-lg mb-2 mr-2 relative">
        
        {/* Top Section */}
        <div className="flex flex-col items-center w-full shrink-0">
          <div className={`w-full flex justify-center transition-all duration-300 ${isSidebarOpen ? 'h-0 opacity-0 mb-0' : 'h-10 opacity-100 mb-2'}`}>
            <button onClick={toggleSidebar} className="p-1.5 text-[#8a8c91] hover:text-white rounded hover:bg-[#2a2b2e] transition">
              <ChevronsRight className="h-5 w-5" />
            </button>
          </div>

          {/* Home Link */}
          <Link href="/dashboard" className="flex flex-col items-center justify-center gap-1 group w-full my-1.5">
            <div className={`relative p-1.5 rounded-lg transition-all duration-200 ${pathname === '/dashboard' ? 'text-white bg-[#2a2b2e]' : 'text-[#8a8c91] group-hover:text-white group-hover:bg-[#2a2b2e]/50'}`}>
              {pathname === '/dashboard' && <div className="absolute inset-0 bg-linear-to-br from-blue-500/40 via-purple-500/40 to-pink-500/40 rounded-lg blur-md opacity-80" />}
              <Home className={`h-5 w-5 relative z-10 ${pathname === '/dashboard' ? 'text-white' : ''}`} />
            </div>
            <span className={`text-[10px] font-medium transition-colors ${pathname === '/dashboard' ? 'text-white' : 'text-[#8a8c91] group-hover:text-white'}`}>Home</span>
          </Link>

          <RailItem icon={Calendar} label="Planner" active={active === 'Planner'} onClick={() => setActive('Planner')} />

          {/* AI Link */}
          <Link href="/ai" className="flex flex-col items-center justify-center gap-1 group w-full my-1.5">
            <div className={`relative p-1.5 rounded-lg transition-all duration-200 ${pathname === '/ai' ? 'text-white bg-[#2a2b2e]' : 'text-[#8a8c91] group-hover:text-white group-hover:bg-[#2a2b2e]/50'}`}>
              {pathname === '/ai' && <div className="absolute inset-0 bg-linear-to-br from-blue-500/40 via-purple-500/40 to-pink-500/40 rounded-lg blur-md opacity-80" />}
              <Image src="/ai-icon.png" alt="AI" width={20} height={20} className={`h-5 w-5 relative z-10 object-contain ${pathname === '/ai' ? 'scale-110' : ''}`} />
            </div>
            <span className={`text-[10px] font-medium transition-colors ${pathname === '/ai' ? 'text-white' : 'text-[#8a8c91] group-hover:text-white'}`}>AI</span>
          </Link>

          <Link href="/teams" className="flex flex-col items-center justify-center gap-1 group w-full my-1.5">
            <div className={`relative p-1.5 rounded-lg transition-all duration-200 ${pathname === '/teams' ? 'text-white bg-[#2a2b2e]' : 'text-[#8a8c91] group-hover:text-white group-hover:bg-[#2a2b2e]/50'}`}>
              {pathname === '/teams' && <div className="absolute inset-0 bg-linear-to-br from-blue-500/40 via-purple-500/40 to-pink-500/40 rounded-lg blur-md opacity-80" />}
              <Users className={`h-5 w-5 relative z-10 ${pathname === '/teams' ? 'text-white' : ''}`} />
            </div>
            <span className={`text-[10px] font-medium transition-colors ${pathname === '/teams' ? 'text-white' : 'text-[#8a8c91] group-hover:text-white'}`}>Teams</span>
          </Link>
          
          {/* The More Button */}
          <MoreMenu />
          
        </div>

        <div className="flex-1" />

        {/* Bottom Section */}
        <div className="flex flex-col items-center w-full shrink-0 pb-1">
          <Link href="/labs" className="flex flex-col items-center justify-center gap-1 group w-full my-1.5">
            <div className={`relative p-1.5 rounded-lg transition-all duration-200 ${pathname === '/labs' ? 'text-white bg-[#2a2b2e]' : 'text-[#8a8c91] group-hover:text-white group-hover:bg-[#2a2b2e]/50'}`}>
              {pathname === '/labs' && <div className="absolute inset-0 bg-linear-to-br from-blue-500/40 via-purple-500/40 to-pink-500/40 rounded-lg blur-md opacity-80" />}
              <FlaskConical className={`h-5 w-5 relative z-10 ${pathname === '/labs' ? 'text-white' : ''}`} />
            </div>
            <span className={`text-[10px] font-medium transition-colors ${pathname === '/labs' ? 'text-white' : 'text-[#8a8c91] group-hover:text-white'}`}>Labs</span>
          </Link>
          <RailItem icon={UserPlus} label="Invite" active={false} onClick={() => setInviteModalOpen(true)} />

          <Link href="/upgrade" className="flex flex-col items-center gap-1 text-[#8a8c91] hover:text-white transition mt-3 group">
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
    { icon: Video, label: 'Clips', color: 'text-red-400', bg: 'bg-red-500/20' },
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
        <div className={`relative p-1.5 rounded-lg transition-all duration-200 ${
          isOpen ? 'text-white bg-[#2a2b2e]' : 'text-[#8a8c91] group-hover:text-white group-hover:bg-[#2a2b2e]/50'
        }`}>
          <Grip className={`h-5 w-5 relative z-10`} />
        </div>
        <span className={`text-[10px] font-medium transition-colors ${isOpen ? 'text-white' : 'text-[#8a8c91] group-hover:text-white'}`}>
          More
        </span>
      </button>

      {/* Popover Menu - FIXED TO BOTTOM OF SCREEN */}
      {isOpen && (
        <div className="fixed bottom-4 left-17.5 w-75 bg-[#1e1f21] border border-[#333438] rounded-xl shadow-2xl p-4 z-999 animate-in fade-in slide-in-from-left-2 duration-200">
          
          <div className="grid grid-cols-3 gap-y-5 gap-x-2">
            {items.map((item, i) => (
              <button key={i} className="flex flex-col items-center gap-2 group">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${item.bg} group-hover:scale-105 transition-transform`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <span className="text-[11px] font-medium text-[#e5e5e5] group-hover:text-white transition-colors">
                  {item.label}
                </span>
              </button>
            ))}
            
            <button className="flex flex-col items-center gap-2 group">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[#2a2b2e] group-hover:scale-105 transition-transform">
                  <span className="text-lg">🧩</span>
                </div>
                <span className="text-[11px] font-medium text-[#e5e5e5] group-hover:text-white transition-colors">
                  Apps
                </span>
              </button>
          </div>

          <div className="mt-5 pt-3 border-t border-[#333438]">
            <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-[#2a2b2e] text-[#e5e5e5] text-[12px] font-medium transition">
              <Settings className="h-3.5 w-3.5" /> Customize navigation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RailItem({ icon: Icon, label, active, onClick, isGradient }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-1 group w-full my-1.5">
      <div className={`relative p-1.5 rounded-lg transition-all duration-200 ${active ? 'text-white bg-[#2a2b2e]' : 'text-[#8a8c91] group-hover:text-white group-hover:bg-[#2a2b2e]/50'}`}>
        {isGradient && active && <div className="absolute inset-0 bg-linear-to-br from-blue-500/40 via-purple-500/40 to-pink-500/40 rounded-lg blur-md opacity-80" />}
        <Icon className={`h-5 w-5 relative z-10 ${active && isGradient ? 'text-white' : ''}`} />
      </div>
      <span className={`text-[10px] font-medium transition-colors ${active ? 'text-white' : 'text-[#8a8c91] group-hover:text-white'}`}>
        {label}
      </span>
    </button>
  );
}