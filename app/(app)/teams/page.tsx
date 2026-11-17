// frontend/app/(app)/teams/page.tsx
'use client';

import { useState } from 'react';
import { 
  Plus, 
  Users, 
  ArrowRight, 
  ArrowLeft,
  UserPlus,
  Play,
  Calendar,
  Layers,
  Circle,
  CheckCircle2
} from 'lucide-react';
import NewTeamModal from '@/components/NewTeamModal'; // We will create this next

export default function TeamsPage() {
  const [teamModalOpen, setTeamModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-(--c-121212) text-(--c-white) overflow-hidden relative">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-(--c-2a2b2e)">
        <h1 className="text-[15px] font-semibold text-(--c-white)">All Teams</h1>
        <button 
          onClick={() => setTeamModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-(--c-white) hover:opacity-85 text-(--c-1e1f21) rounded-md text-[13px] font-semibold transition"
        >
          Create Team
        </button>
      </div>

      {/* Hero Section */}
      <div className="px-8 py-12 max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
        
        {/* Left Side: Text */}
        <div className="flex-1 space-y-6">
          <h1 className="text-6xl font-bold tracking-tight leading-[1.1]">
            Align teams<br />
            and visualize<br />
            their work!
          </h1>
          <p className="text-(--c-8a8c91) text-lg max-w-md leading-relaxed">
            Use Teams Hub to coordinate teams, organize priorities, and understand the details of their work.
          </p>
          <div className="flex items-center gap-3 pt-4">
             <button 
               onClick={() => setTeamModalOpen(true)}
               className="px-6 py-2.5 bg-(--c-white) hover:opacity-85 text-(--c-1e1f21) rounded-lg font-semibold text-sm transition"
             >
               Create Team
             </button>
             <button className="px-6 py-2.5 bg-(--c-2a2b2e) hover:bg-(--c-333438) border border-(--c-333438) text-(--c-white) rounded-lg font-semibold text-sm transition">
               Browse People
             </button>
          </div>
        </div>

        {/* Right Side: Graphic Card */}
        <div className="flex-1 w-full max-w-lg">
          <div className="bg-(--c-1e1f21) border border-(--c-333438) rounded-2xl p-6 shadow-2xl">
            
            {/* Mockup UI */}
            <div className="bg-(--c-2a2b2e) rounded-xl p-4 mb-6 relative overflow-hidden">
               {/* Header inside mockup */}
               <div className="flex justify-between items-center mb-4 text-[10px] text-(--c-8a8c91)">
                 <div className="bg-(--c-1e1f21) px-2 py-1 rounded">Day</div>
                 <div>Group By</div>
               </div>
               
               {/* Gantt Chart Grid Lines */}
               <div className="absolute inset-0 flex justify-between px-4 top-10 pointer-events-none opacity-20">
                  {Array.from({length: 8}).map((_, i) => (
                    <div key={i} className="w-px h-full bg-(--c-white)" />
                  ))}
               </div>

               {/* Timeline Tasks */}
               <div className="space-y-2 relative z-10">
                 {/* Row 1 */}
                 <div className="flex items-center gap-2">
                   <div className="w-24 bg-(--c-333438) text-[10px] px-2 py-1.5 rounded text-(--c-white) truncate">4.0 Designs</div>
                   <div className="h-6 w-48 bg-blue-900/40 border border-blue-500/30 rounded text-[10px] flex items-center px-2 text-blue-200">
                      <Circle className="h-2 w-2 mr-1 fill-current" /> Todo page
                   </div>er:b
                 </div>
                 
                 {/* Row 2 */}
                 <div className="flex items-center gap-2 justify-end">
                   <div className="h-6 w-40 bg-indigo-900/40 border border-indigo-500/30 rounded text-[10px] flex items-center px-2 text-indigo-200">
                      <Play className="h-2 w-2 mr-1 fill-current" /> AI creation modal
                   </div>
                 </div>

                 {/* Row 3 */}
                 <div className="flex items-center gap-2">
                   <div className="w-24"></div>
                   <div className="h-6 w-52 bg-red-900/40 border border-red-500/30 rounded text-[10px] flex items-center px-2 text-red-200">
                      <Circle className="h-2 w-2 mr-1 fill-current text-red-400" /> Chat: Next gen view changer
                   </div>
                 </div>

                 {/* Row 4 */}
                 <div className="flex items-center gap-2">
                   <div className="w-24"></div>
                   <div className="h-6 w-28 bg-blue-900/40 border border-blue-500/30 rounded text-[10px] flex items-center px-2 text-blue-200">
                      <CheckCircle2 className="h-2 w-2 mr-1 fill-current" /> Update WS pick...
                   </div>
                 </div>
               </div>
            </div>

            {/* Card Text */}
            <h3 className="text-xl font-bold text-(--c-white) mb-2">Comprehensive Team capacity views</h3>
            <p className="text-sm text-(--c-8a8c91)">
              Monitor your team's workload, project timelines, and progress, all in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Teams List Placeholder */}
      <div className="px-8 max-w-6xl mx-auto mt-8">
         <div className="flex items-center justify-between mb-4">
           <h2 className="text-lg font-semibold">Your Teams</h2>
           <div className="flex gap-2 text-(--c-8a8c91)">
             <button className="p-1 hover:text-(--c-white) transition"><ArrowLeft className="h-5 w-5" /></button>
             <button className="p-1 hover:text-(--c-white) transition"><ArrowRight className="h-5 w-5" /></button>
           </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Empty State / Placeholder Cards */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-(--c-1e1f21) border border-[color:var(--c-333438)] rounded-xl p-5 hover:border-[color:var(--c-444548)] transition cursor-pointer group">
                <div className="h-10 w-10 rounded-lg bg-(--c-2a2b2e) border border-[color:var(--c-333438)] flex items-center justify-center mb-4 group-hover:scale-105 transition">
                  <Users className="h-5 w-5 text-[color:var(--c-8a8c91)]" />
                </div>
                <div className="h-4 w-32 bg-[color:var(--c-2a2b2e)] rounded mb-2" />
                <div className="h-3 w-48 bg-[color:var(--c-2a2b2e)] rounded" />
              </div>
            ))}
         </div>
      </div>

      {/* Render New Team Modal */}
      <NewTeamModal open={teamModalOpen} onClose={() => setTeamModalOpen(false)} />
    </div>
  );
}