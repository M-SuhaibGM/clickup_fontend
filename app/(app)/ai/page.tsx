'use client';

import { useState } from 'react';
import { Plus, Zap, Mic, Send, ChevronDown, MonitorPlay, Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function AiPage() {
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'Ask' | 'Agents'>('Ask');

  return (
    <div className="flex flex-col h-full bg-[#1e1f21] relative overflow-hidden">
      
      {/* Background gradient glow at top */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Top right Memory button */}
      <div className="absolute top-4 right-4 z-10">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-[#2a2b2e] text-[#e5e5e5] text-sm font-medium transition">
          <MonitorPlay className="h-4 w-4" /> Memory
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full px-4 -mt-20">
        
        {/* Brain Logo & Title */}
        <div className="flex items-center gap-3 mb-8">
          <Image src="/ai-icon.png" alt="Brain" width={40} height={40} className="w-10 h-10 object-contain" />
          <h1 className="text-4xl font-semibold text-white tracking-tight flex items-start">
            Brain<span className="text-sm mt-1 ml-0.5 text-[#8a8c91]">2</span>
          </h1>
        </div>

        {/* Custom Tab Switcher */}
        <div className="flex items-center gap-1 mb-2 w-full">
          <button 
            onClick={() => setActiveTab('Ask')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === 'Ask' 
                ? 'bg-[#1e1f21] text-white border-t border-l border-[#333438] relative z-10 -mb-[1px]' 
                : 'text-[#8a8c91] hover:text-white bg-[#2a2b2e]/50'
            }`}
          >
            <Image src="/ai-icon.png" alt="AI" width={16} height={16} /> Ask
          </button>
          <button 
            onClick={() => setActiveTab('Agents')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === 'Agents' 
                ? 'bg-[#1e1f21] text-white border-t border-l border-[#333438] relative z-10 -mb-[1px]' 
                : 'text-[#8a8c91] hover:text-white bg-[#2a2b2e]/50'
            }`}
          >
            <MonitorPlay className="h-4 w-4" /> Agents
          </button>
        </div>

        {/* Input Box with Animated Gradient Border */}
        <div className="w-full relative p-[2px] rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 mb-8 shadow-lg shadow-purple-500/20">
          <div className="bg-[#1e1f21] rounded-[10px] w-full flex flex-col overflow-hidden">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Let's get you started"
              className="w-full bg-transparent p-4 text-white placeholder:text-[#8a8c91] outline-none resize-none h-24 text-sm"
            />
            
            <div className="flex items-center justify-between px-3 py-2 bg-[#1e1f21] border-t border-[#333438]/50">
              <div className="flex items-center gap-2">
                <button className="p-1.5 text-[#8a8c91] hover:text-white hover:bg-[#2a2b2e] rounded-md transition">
                  <Plus className="h-4 w-4" />
                </button>
                <button className="flex items-center gap-1.5 px-2 py-1 text-[#8a8c91] hover:text-white hover:bg-[#2a2b2e] rounded-md text-[13px] transition">
                  <Zap className="h-3.5 w-3.5" /> Skills
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 text-[13px] font-medium text-[#8a8c91] hover:text-white transition">
                  <Image src="/ai-icon.png" alt="Max" width={14} height={14} /> Max <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button className="p-1.5 text-[#8a8c91] hover:text-white rounded-md transition">
                  <Mic className="h-4 w-4" />
                </button>
                <button className="p-1.5 bg-[#2a2b2e] text-white rounded-md hover:bg-[#333438] transition">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Promo Card */}
        <div className="w-full bg-[#1e1f21] border border-[#333438] rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <Image src="/ai-icon.png" alt="Icon" width={16} height={16} />
            <span className="text-lg leading-none">🧠</span>
            <span className="text-lg leading-none">✨</span>
            <span className="text-lg leading-none">🤖</span>
          </div>
          <h3 className="text-[15px] font-bold text-white">Unlock Brain AI, the AI that knows your work</h3>
          <p className="text-[13px] text-[#8a8c91]">
            Claude, GPT, and Gemini in one place, with context from your tasks, docs, and conversations. Included with Business.
          </p>
          <button className="self-start mt-1 px-4 py-1.5 bg-white hover:bg-gray-200 text-black text-[13px] font-semibold rounded-md transition">
            See upgrades
          </button>
        </div>

      </div>
    </div>
  );
}