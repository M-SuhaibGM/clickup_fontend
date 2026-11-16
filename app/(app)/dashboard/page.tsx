'use client';

import Link from 'next/link';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { 
  Calendar as CalendarIcon, 
  LayoutGrid, 
  Clock, 
  CheckCircle2, 
  Users, 
  Plus, 
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';

export default function OverviewPage() {
  const projects = useProjectStore((s) => s.projects);
  const user = useAuthStore((s) => s.user);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);

  return (
    <div className="min-h-screen bg-[#1e1f21] text-white p-6 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- 1. Hero / Marketing Banner (Like ClickUp's "You, but better organized") --- */}
        <div className="relative rounded-2xl overflow-hidden bg-[#2a2b2e] border border-[#333438] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

          <div className="flex-1 z-10">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              You, but better organized
            </h1>
            <p className="text-[#8a8c91] text-sm md:text-base max-w-md mb-6">
              Connect your calendar to manage events, time-block your work, and take meeting notes — all in one place.
            </p>
            <div className="flex flex-wrap items-center gap-3">
               <button className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-200 text-black rounded-lg font-semibold text-sm transition">
                 <CalendarIcon className="h-4 w-4" /> Connect Calendar
               </button>
               <button className="flex items-center gap-2 px-5 py-2.5 bg-[#1e1f21] border border-[#444548] hover:bg-[#333438] text-white rounded-lg font-medium text-sm transition">
                 Learn more
               </button>
            </div>
          </div>
          
          {/* Mocked Graphic Area */}
          <div className="hidden lg:block w-96 h-56 bg-[#1e1f21] border border-[#333438] rounded-xl p-4 shadow-2xl z-10 transform rotate-2">
             <div className="flex items-center justify-between text-xs text-[#8a8c91] mb-4">
               <span>Today, Mar 14</span>
               <span className="text-emerald-400">Notetaker: On</span>
             </div>
             <div className="space-y-2">
                <div className="h-10 bg-[#2a2b2e] rounded border border-[#333438] flex items-center px-3 text-[11px]">
                   <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" /> Design Sprint Feedback
                </div>
                <div className="h-10 bg-[#2a2b2e] rounded border border-[#333438] flex items-center px-3 text-[11px]">
                   <span className="w-2 h-2 rounded-full bg-fuchsia-500 mr-2" /> Calendar Sync
                </div>
                <div className="h-10 bg-[#2a2b2e] rounded border border-[#333438] flex items-center px-3 text-[11px]">
                   <span className="w-2 h-2 rounded-full bg-amber-500 mr-2" /> AI Notetaker Setup
                </div>
             </div>
          </div>
        </div>

        {/* --- 2. Project Overview Section --- */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Projects in {activeWorkspace?.name}</h2>
            <span className="text-xs text-[#8a8c91]">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#333438] bg-[#232426] p-12 text-center">
              <div className="mx-auto h-12 w-12 rounded-xl bg-[#2a2b2e] flex items-center justify-center mb-3">
                <LayoutGrid className="h-6 w-6 text-[#8a8c91]" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">No projects yet</h3>
              <p className="text-sm text-[#8a8c91] mb-4">Create your first project to get started.</p>
              <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition">
                <Plus className="h-4 w-4" /> Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="group flex flex-col bg-[#232426] border border-[#333438] rounded-xl p-4 hover:border-[#444548] hover:bg-[#2a2b2e] transition-all"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                    <h3 className="font-semibold text-[14px] text-white truncate">{p.name}</h3>
                  </div>
                  
                  {p.description && (
                    <p className="text-[12px] text-[#8a8c91] line-clamp-2 mb-4">{p.description}</p>
                  )}

                  <div className="mt-auto pt-3 border-t border-[#333438] flex items-center justify-between text-[11px] text-[#8a8c91]">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><LayoutGrid className="h-3.5 w-3.5" /> {p._count?.lists ?? 0} lists</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> 0 tasks</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-white" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* --- 3. Bottom Widgets (Stats & Recent Activity) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Recents / Tasks Card */}
           <div className="bg-[#232426] border border-[#333438] rounded-xl p-5">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-[13px] font-semibold text-white uppercase tracking-wider">Recent Tasks</h3>
               <Link href="/my-tasks" className="text-[11px] text-indigo-400 hover:text-indigo-300 transition">View all</Link>
             </div>
             
             <div className="space-y-2">
                {/* Empty state placeholder for tasks */}
                <div className="flex flex-col items-center justify-center py-8 text-[#8a8c91]">
                  <CheckCircle2 className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">You're all caught up!</p>
                </div>
             </div>
           </div>

           {/* Workspace Stats Card */}
           <div className="bg-[#232426] border border-[#333438] rounded-xl p-5">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-[13px] font-semibold text-white uppercase tracking-wider">Workspace Stats</h3>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1e1f21] border border-[#333438] p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-[#8a8c91] mb-1">
                    <Users className="h-3.5 w-3.5" /> <span className="text-[11px]">Members</span>
                  </div>
                  <span className="text-xl font-bold text-white">{activeWorkspace?._count?.members || 1}</span>
                </div>
                
                <div className="bg-[#1e1f21] border border-[#333438] p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-[#8a8c91] mb-1">
                    <LayoutGrid className="h-3.5 w-3.5" /> <span className="text-[11px]">Projects</span>
                  </div>
                  <span className="text-xl font-bold text-white">{projects.length}</span>
                </div>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}