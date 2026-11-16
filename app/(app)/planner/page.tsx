'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Video, Calendar as CalendarIcon, Check, X, Search, ArrowRight, CornerDownLeft } from 'lucide-react';
import Image from 'next/image';

export default function PlannerPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  return (
    <div className="flex flex-col h-full bg-[#121212] relative overflow-hidden">
      
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(to right, #333438 1px, transparent 1px), linear-gradient(to bottom, #333438 1px, transparent 1px)`,
          backgroundSize: '100px 100px',
          transform: 'rotate(-5deg) scale(1.2)',
          transformOrigin: 'top left'
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center p-8 md:p-16 max-w-7xl mx-auto w-full gap-12">
        
        {/* Left Side: Text & Buttons */}
        <div className="flex-1 space-y-8 max-w-lg">
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.1]">
            You, but better<br />organized
          </h1>
          <p className="text-[#8a8c91] text-lg leading-relaxed">
            Connect your calendar to manage events, time block your work, and take meeting notes - powered by ClickUp AI.
          </p>
          
          <div className="pt-4">
            <p className="text-sm font-semibold text-white mb-3">Get started with</p>
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1e1f21] hover:bg-[#2a2b2e] border border-[#333438] rounded-lg text-sm font-medium text-white transition-colors shadow-sm">
                <span className="text-lg leading-none">📅</span> Google Calendar
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1e1f21] hover:bg-[#2a2b2e] border border-[#333438] rounded-lg text-sm font-medium text-white transition-colors shadow-sm">
                <span className="text-lg leading-none">📧</span> Microsoft Outlook
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: The Carousel/Cards */}
        <div className="flex-1 flex items-center justify-center relative w-full min-h-[400px]">
          
          {/* Main Card (Center) */}
          <div className="w-[380px] bg-[#1e1f21] border border-[#333438] rounded-2xl p-4 shadow-2xl z-20">
            {/* Mockup Header */}
            <div className="flex items-center justify-between mb-4 bg-[#2a2b2e] rounded-t-lg p-2">
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-2 py-1 bg-[#12b76a] text-white text-xs font-semibold rounded">
                  <Video className="h-3 w-3" /> Join
                </button>
                <span className="text-xs text-white">Design Sprint Feedback</span>
                <span className="text-[10px] bg-[#f04438] text-white px-1.5 py-0.5 rounded">in 5m</span>
              </div>
              <div className="flex items-center gap-1 text-[#8a8c91]">
                <Search className="h-3 w-3" />
                <span className="text-[10px]">Search or Ask</span>
              </div>
            </div>

            {/* Calendar Grid Mockup */}
            <div className="relative h-40 bg-[#1e1f21] border border-[#333438] rounded-lg overflow-hidden mb-4">
              {/* Vertical lines */}
              <div className="absolute inset-0 flex justify-between px-4">
                {[1,2,3,4,5].map(i => <div key={i} className="w-px h-full bg-[#333438]/50" />)}
              </div>
              
              {/* Event Block */}
              <div className="absolute top-4 left-4 w-48 bg-[#0d2a23] border-l-2 border-[#12b76a] p-2 rounded-r">
                <p className="text-[11px] text-[#12b76a] font-semibold truncate">Design Sprint Feedback</p>
                <p className="text-[10px] text-[#12b76a]/70">12 - 1pm</p>
              </div>

              {/* Floating Tooltip */}
              <div className="absolute top-20 right-4 w-64 bg-[#2a2b2e] border border-[#333438] rounded-lg shadow-xl p-3 z-30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-[#8a8c91] flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> Event</span>
                  <div className="flex gap-1 text-[#8a8c91]"><span>...</span><span>🗑️</span><span>✕</span></div>
                </div>
                <p className="text-sm font-semibold text-white mb-1">Design Sprint Feedback</p>
                <p className="text-xs text-[#8a8c91] mb-2">13 Nov, 2024 · 12:00 pm → 1:00 pm</p>
                <div className="w-full bg-[#12b76a] text-white text-xs font-medium py-1.5 rounded flex items-center justify-center gap-2">
                  <Video className="h-3 w-3" /> Join Zoom Meeting
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div>
              <h3 className="text-base font-bold text-white mb-1">Join your next meeting</h3>
              <p className="text-sm text-[#8a8c91]">
                See what's next and hop on calls with one click from anywhere in ClickUp.
              </p>
            </div>
          </div>

          {/* Background Cards (Left and Right - Faded) */}
          <div className="absolute -left-12 top-12 w-[300px] h-[350px] bg-[#1e1f21] border border-[#333438] rounded-2xl opacity-40 transform -rotate-6 z-10" />
          <div className="absolute -right-12 top-12 w-[300px] h-[350px] bg-[#1e1f21] border border-[#333438] rounded-2xl opacity-40 transform rotate-6 z-10" />

        </div>
      </div>

      {/* Bottom Navigation Arrows */}
      <div className="relative z-10 flex items-center justify-center gap-4 pb-8">
        <button className="p-2 bg-[#1e1f21] hover:bg-[#2a2b2e] border border-[#333438] rounded-full text-[#8a8c91] hover:text-white transition">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button className="p-2 bg-[#1e1f21] hover:bg-[#2a2b2e] border border-[#333438] rounded-full text-[#8a8c91] hover:text-white transition">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}