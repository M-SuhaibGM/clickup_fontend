'use client';

import { ChevronDown, Filter, Search, Settings, User, Check, Columns, Plus } from 'lucide-react';

export default function TaskToolbar({ isAdmin, onAddTask }: { isAdmin: boolean, onAddTask: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-[#333438] pb-2 mb-2">
      {/* Left Side */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-2.5 py-1 bg-[#2a2b2e] hover:bg-[#333438] border border-[#333438] rounded text-[12px] font-medium text-white transition">
          <span className="text-[#8a8c91]">Group:</span> Status <ChevronDown className="h-3 w-3 text-[#8a8c91]" />
        </button>
        <button className="flex items-center gap-1.5 px-2.5 py-1 hover:bg-[#2a2b2e] rounded text-[12px] font-medium text-[#8a8c91] transition">
          <Check className="h-3 w-3" /> Subtasks
        </button>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-1">
        <button className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#2a2b2e] rounded text-[12px] text-[#8a8c91] transition">
          <Columns className="h-3.5 w-3.5" /> Columns
        </button>
        <button className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#2a2b2e] rounded text-[12px] text-[#8a8c91] transition">
          <Filter className="h-3.5 w-3.5" /> Filter
        </button>
        <button className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#2a2b2e] rounded text-[12px] text-[#8a8c91] transition">
          <Check className="h-3.5 w-3.5" /> Closed
        </button>
        
        {/* Assignee Search pill */}
        <button className="flex items-center gap-1.5 px-2 py-1 hover:bg-[#2a2b2e] rounded text-[12px] text-[#8a8c91] transition">
          <User className="h-3.5 w-3.5" /> Assignee
        </button>
        
        <button className="p-1.5 hover:bg-[#2a2b2e] rounded text-[#8a8c91] transition"><Search className="h-3.5 w-3.5" /></button>
        <button className="p-1.5 hover:bg-[#2a2b2e] rounded text-[#8a8c91] transition"><Settings className="h-3.5 w-3.5" /></button>
        
        {isAdmin && (
          <button onClick={onAddTask} className="ml-2 flex items-center gap-1 px-3 py-1 bg-white hover:bg-gray-200 text-black rounded text-[12px] font-semibold transition">
            Add Task <ChevronDown className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}