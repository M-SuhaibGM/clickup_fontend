'use client';

import { ChevronsRight, Home, Calendar, Sparkles, Users, LayoutGrid, FlaskConical, UserPlus } from 'lucide-react';
import { useState } from 'react';

export default function AppRail({ 
  isSidebarOpen, 
  toggleSidebar 
}: { 
  isSidebarOpen: boolean; 
  toggleSidebar: () => void 
}) {
  const [active, setActive] = useState('Home');

  return (
    // Removed gap-5 and added overflow-hidden to keep everything inside the rounded border
    <div className="w-18 shrink-0 h-full flex flex-col items-center py-3 z-50 bg-[#232426] border border-[#333438] rounded-lg mb-2 overflow-hidden">
      
      {/* Top Section */}
      <div className="flex flex-col items-center w-full shrink-0">
        
        {/* Arrow Logic */}
        <div className={`w-full flex justify-center transition-all duration-300 ${isSidebarOpen ? 'h-0 opacity-0 mb-0' : 'h-10 opacity-100 mb-2'}`}>
          <button 
            onClick={toggleSidebar} 
            className="p-1.5 text-[#8a8c91] hover:text-white rounded hover:bg-[#2a2b2e] transition"
          >
            <ChevronsRight className="h-5 w-5" />
          </button>
        </div>

        {/* Top Icons */}
        <RailItem icon={Home} label="Home" active={active === 'Home'} onClick={() => setActive('Home')} isGradient />
        <RailItem icon={Calendar} label="Planner" active={active === 'Planner'} onClick={() => setActive('Planner')} />
        <RailItem icon={Sparkles} label="AI" active={active === 'AI'} onClick={() => setActive('AI')} />
        <RailItem icon={Users} label="Teams" active={active === 'Teams'} onClick={() => setActive('Teams')} />
        <RailItem icon={LayoutGrid} label="More" active={active === 'More'} onClick={() => setActive('More')} />
      </div>

      {/* Spacer (flex-1 pushes the bottom items down) */}
      <div className="flex-1" />

      {/* Bottom Section */}
      <div className="flex flex-col items-center w-full shrink-0 pb-1">
        <RailItem icon={FlaskConical} label="Labs" active={false} onClick={() => {}} />
        <RailItem icon={UserPlus} label="Invite" active={false} onClick={() => {}} />
        
        {/* Upgrade Icon */}
        <button className="flex flex-col items-center gap-1 text-[#8a8c91] hover:text-white transition mt-3">
          <span className="text-xl leading-none">🚀</span>
          <span className="text-[10px] font-semibold">Upgrade</span>
        </button>
      </div>

    </div>
  );
}

function RailItem({ icon: Icon, label, active, onClick, isGradient }: any) {
  return (
    <button 
      onClick={onClick} 
      // Added my-1.5 for consistent spacing between items
      className="flex flex-col items-center justify-center gap-1 group w-full my-1.5"
    >
      <div className={`relative p-1.5 rounded-lg transition-all duration-200 ${
        active ? 'text-white bg-[#2a2b2e]' : 'text-[#8a8c91] group-hover:text-white group-hover:bg-[#2a2b2e]/50'
      }`}>
        {/* Gradient glow for active state (only for Home) */}
        {isGradient && active && (
          <div className="absolute inset-0 bg-linear-to-br from-blue-500/40 via-purple-500/40 to-pink-500/40 rounded-lg blur-md opacity-80" />
        )}
        
        <Icon className={`h-5 w-5 relative z-10 ${active && isGradient ? 'text-white' : ''}`} />
      </div>
      
      <span className={`text-[10px] font-medium transition-colors ${active ? 'text-white' : 'text-[#8a8c91] group-hover:text-white'}`}>
        {label}
      </span>
    </button>
  );
}