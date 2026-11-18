'use client';

import { useState, useRef, useEffect } from 'react';
import { Video, Mic } from 'lucide-react';
import { lazyOnOpen } from '../LazyMount';

import UserMenu from './UserMenu';
import { useCreateModal } from '@/store/createModalStore';

const RecordVideoDropdown = lazyOnOpen(() => import('../RecordVideoDropdown'));
const RecordAudioDropdown = lazyOnOpen(() => import('../RecordAudioDropdown'));

const iconBtn = (open: boolean) =>
  `p-1.5 rounded transition ${
    open
      ? 'bg-(--c-2a2b2e) text-(--c-white)'
      : 'text-(--c-8a8c91) hover:text-(--c-white) hover:bg-(--c-2a2b2e)'
  }`;

function CheckPlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20.5 13a8.5 8.5 0 1 1-8.5-9" />
      <path d="m8.5 12 2.5 2.5 4.5-4.5" />
      <path d="M19 2v6M16 5h6" />
    </svg>
  );
}

export default function TopbarActions() {
  const [recordDropdownOpen, setRecordDropdownOpen] = useState(false);
  const [recordAudioDropdownOpen, setRecordAudioDropdownOpen] = useState(false);
  const recordVideoRef = useRef<HTMLDivElement>(null);
  const recordAudioRef = useRef<HTMLDivElement>(null);
  const modalOpen = useCreateModal((s) => s.open);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (recordVideoRef.current && !recordVideoRef.current.contains(e.target as Node)) {
        setRecordDropdownOpen(false);
      }
      if (recordAudioRef.current && !recordAudioRef.current.contains(e.target as Node)) {
        setRecordAudioDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="flex items-center justify-end gap-1.5 flex-1">
      <button
        onClick={() => useCreateModal.getState().openModal('reminder')}
        aria-label="Create reminder"
        title="Create reminder"
        className={iconBtn(modalOpen)}
      >
        <CheckPlusIcon className="h-4 w-4" />
      </button>


      <div className="relative" ref={recordVideoRef}>
        <button onClick={() => setRecordDropdownOpen(!recordDropdownOpen)} className={iconBtn(recordDropdownOpen)}>
          <Video className="h-4 w-4" />
        </button>
        <RecordVideoDropdown open={recordDropdownOpen} onClose={() => setRecordDropdownOpen(false)} />
      </div>

      <div className="relative" ref={recordAudioRef}>
        <button onClick={() => setRecordAudioDropdownOpen(!recordAudioDropdownOpen)} className={iconBtn(recordAudioDropdownOpen)}>
          <Mic className="h-4 w-4" />
        </button>
        <RecordAudioDropdown open={recordAudioDropdownOpen} onClose={() => setRecordAudioDropdownOpen(false)} />
      </div>

      <UserMenu onRecordClip={() => setRecordDropdownOpen(true)} onTalkToText={() => setRecordAudioDropdownOpen(true)} />
    </div>
  );
}
