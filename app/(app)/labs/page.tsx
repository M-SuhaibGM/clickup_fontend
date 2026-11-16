// frontend/app/(app)/labs/page.tsx
'use client';

import { useState } from 'react';
import { 
  FlaskConical, 
  Sparkles, 
  Palette, 
  GitMerge, 
  CheckCircle2,
  CalendarClock,
  RefreshCcw,
  LogOut,
  LayoutGrid
} from 'lucide-react';

export default function LabsPage() {
  const [joined, setJoined] = useState(false);

  return (
    <div className="relative min-h-screen bg-[color:var(--c-121212)] overflow-hidden rounded-xl">
      
      {/* Background Holographic Gradient Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob" />
        <div className="absolute top-0 -right-40 w-96 h-96 bg-blue-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute -bottom-40 left-20 w-96 h-96 bg-pink-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 p-8 max-w-5xl mx-auto flex flex-col gap-6">
        
        {/* Top Card */}
        <div className="bg-[color:var(--c-1e1f21)]/90 backdrop-blur-xl border border-[color:var(--c-333438)] rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            
            {/* Left Side Text */}
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-[color:var(--c-white)] mb-4 tracking-tight">
                Try tomorrow's<br />
                ClickUp <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">today</span>
              </h1>
              <p className="text-[color:var(--c-8a8c91)] text-sm md:text-base max-w-md leading-relaxed mb-6">
                ClickUp Labs gives you early access to experimental features. Choose which features you want on or off, and help shape what ships.
              </p>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setJoined(!joined)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    joined 
                      ? 'bg-[color:var(--c-2a2b2e)] text-[color:var(--c-white)] border border-[color:var(--c-333438)]' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white shadow-lg shadow-indigo-500/20'
                  }`}
                >
                  <FlaskConical className="h-4 w-4" /> 
                  {joined ? 'Joined Labs' : 'Join ClickUp Labs'}
                </button>
                <button className="text-sm text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition">
                  Read the Labs terms
                </button>
              </div>
            </div>

            {/* Right Side Floating Cards */}
            <div className="hidden lg:flex flex-col gap-3 relative w-72">
              <div className="bg-[color:var(--c-1e1f21)]/80 backdrop-blur-md border border-[color:var(--c-333438)] p-3 rounded-xl flex items-center gap-3 shadow-xl transform translate-x-4">
                <div className="p-2 bg-blue-500/20 rounded-lg"><FlaskConical className="h-5 w-5 text-blue-400" /></div>
                <div>
                  <p className="text-[color:var(--c-white)] font-semibold text-sm">AI Drive</p>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Beta</p>
                </div>
              </div>
              
              <div className="bg-[color:var(--c-1e1f21)]/80 backdrop-blur-md border border-[color:var(--c-333438)] p-3 rounded-xl flex items-center gap-3 shadow-xl transform -translate-x-4">
                <div className="p-2 bg-pink-500/20 rounded-lg"><Palette className="h-5 w-5 text-pink-400" /></div>
                <div>
                  <p className="text-[color:var(--c-white)] font-semibold text-sm">Creative Studio</p>
                  <p className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">Beta</p>
                </div>
              </div>
              
              <div className="bg-[color:var(--c-1e1f21)]/80 backdrop-blur-md border border-[color:var(--c-333438)] p-3 rounded-xl flex items-center gap-3 shadow-xl transform translate-x-2">
                <div className="p-2 bg-emerald-500/20 rounded-lg"><GitMerge className="h-5 w-5 text-emerald-400" /></div>
                <div>
                  <p className="text-[color:var(--c-white)] font-semibold text-sm">Mermaid diagrams</p>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Beta</p>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-[color:var(--c-2a2b2e)] my-8" />

          {/* How Labs Works Section */}
          <div>
            <h3 className="text-[color:var(--c-white)] font-medium mb-4">How Labs works</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureCard icon={CheckCircle2} text="You choose what's on" />
              <FeatureCard icon={RefreshCcw} text="Changes apply after a reload" />
              <FeatureCard icon={CalendarClock} text="Switch tiers any time" />
              <FeatureCard icon={LogOut} text="Leave whenever you want" />
            </div>
          </div>
        </div>

        {/* Bottom Card (Experiments Placeholder) */}
        <div className="bg-[color:var(--c-1e1f21)]/90 backdrop-blur-xl border border-[color:var(--c-333438)] rounded-2xl p-8 shadow-2xl">
           <h2 className="text-xl font-bold text-[color:var(--c-white)] mb-4">Experiments</h2>
           <div className="flex flex-col items-center justify-center p-12 text-[color:var(--c-8a8c91)] border border-dashed border-[color:var(--c-333438)] rounded-xl">
              <LayoutGrid className="h-10 w-10 mb-3 opacity-50" />
              <p>More experiments are on the way.</p>
           </div>
        </div>

      </div>
    </div>
  );
}

// Helper component for the "How Labs Works" cards
function FeatureCard({ icon: Icon, text }: { icon: any, text: string }) {
  return (
    <div className="bg-[color:var(--c-1e1f21)]/50 border border-[color:var(--c-333438)] rounded-xl p-4 flex items-center gap-3">
      <Icon className="h-4 w-4 text-[color:var(--c-8a8c91)]" />
      <span className="text-sm text-[color:var(--c-e5e5e5)]">{text}</span>
    </div>
  );
}