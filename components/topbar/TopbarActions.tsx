'use client';

import { useState, useRef, useEffect } from 'react';
import { Video, Mic, Bell } from 'lucide-react';
import RecordVideoDropdown from '../RecordVideoDropdown';
import RecordAudioDropdown from '../RecordAudioDropdown';
import UserMenu from './UserMenu';
import { useCreateModal } from '@/store/createModalStore';

const iconBtn = (open: boolean) =>
  `p-1.5 rounded transition ${
    open
      ? 'bg-(--c-2a2b2e) text-(--c-white)'
      : 'text-(--c-8a8c91) hover:text-(--c-white) hover:bg-(--c-2a2b2e)'
  }`;

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

      <button
        onClick={() => useCreateModal.getState().openModal('reminder')}
        aria-label="Create reminder"
        title="Create reminder"
        className={iconBtn(modalOpen)}
      >
        <Bell className="h-4 w-4" />
      </button>

      <div className="h-4 w-px bg-(--c-333438) mx-1" />

      <UserMenu onRecordClip={() => setRecordDropdownOpen(true)} onTalkToText={() => setRecordAudioDropdownOpen(true)} />
    </div>
  );
}
