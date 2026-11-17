// frontend/components/Notepad.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, X, MoreHorizontal, Pencil, FileText, FileDown, Trash2, Plus, Check } from 'lucide-react';

type Note = { id: string; title: string; content: string; updatedAt: number };

const STORAGE_KEY = 'notepad:notes';

function newNote(): Note {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    content: '',
    updatedAt: Date.now(),
  };
}

function safeName(title: string) {
  return (title.trim() || 'note').replace(/[\\/:*?"<>|]+/g, '-');
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Notepad({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null); // null => list view
  const [renaming, setRenaming] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: Note[] = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed) && parsed.length) {
        setNotes(parsed);
      } else {
        const n = newNote();
        setNotes([n]);
        setActiveId(n.id);
      }
    } catch {
      const n = newNote();
      setNotes([n]);
      setActiveId(n.id);
    }
    setLoaded(true);
  }, []);

  // Persist
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {}
  }, [notes, loaded]);

  // Close on outside click (ignore clicks inside dropdown portals)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (containerRef.current && !containerRef.current.contains(target)) onClose();
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  const active = notes.find((n) => n.id === activeId) ?? null;

  const update = useCallback((id: string, patch: Partial<Note>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)));
  }, []);

  const addNote = () => {
    const n = newNote();
    setNotes((prev) => [n, ...prev]);
    setActiveId(n.id);
  };

  const deleteNote = () => {
    if (!active) return;
    setNotes((prev) => prev.filter((n) => n.id !== active.id));
    setActiveId(null);
  };

  const startRename = () => {
    if (!active) return;
    setRenameValue(active.title);
    setRenaming(true);
  };

  const commitRename = () => {
    if (active && renameValue.trim()) update(active.id, { title: renameValue.trim() });
    setRenaming(false);
  };

  const exportPdf = async () => {
    if (!active) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 48;
    const width = doc.internal.pageSize.getWidth() - margin * 2;
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    let y = margin;
    for (const line of doc.splitTextToSize(active.title, width)) {
      doc.text(line, margin, y);
      y += 24;
    }
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    for (const line of doc.splitTextToSize(active.content || ' ', width)) {
      if (y > pageH - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 16;
    }
    doc.save(`${safeName(active.title)}.pdf`);
  };

  const exportWord = () => {
    if (!active) return;
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${escapeHtml(active.title)}</title></head><body><h1>${escapeHtml(active.title)}</h1>${active.content
      .split('\n')
      .map((l) => `<p>${escapeHtml(l) || '&nbsp;'}</p>`)
      .join('')}</body></html>`;
    download(new Blob(['﻿', html], { type: 'application/msword' }), `${safeName(active.title)}.doc`);
  };

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className="fixed right-4 top-12 w-112.5 bg-[#1e1f21] border border-[#333438] rounded-xl shadow-2xl z-200 flex flex-col animate-in fade-in slide-in-from-top-4 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#333438] bg-[#1e1f21] rounded-t-xl">
        <div className="flex items-center gap-2 min-w-0">
          {active ? (
            <button onClick={() => { setRenaming(false); setMenuOpen(false); setActiveId(null); }} className="p-1 text-[#8a8c91] hover:text-white rounded transition" title="All notes">
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : null}
          {active && renaming ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') setRenaming(false);
                }}
                className="bg-[#2a2b2e] border border-[#333438] rounded px-2 py-0.5 text-[13px] text-white outline-none w-52"
              />
              <button onClick={commitRename} className="p-1 text-[#8a8c91] hover:text-white"><Check className="h-4 w-4" /></button>
            </div>
          ) : (
            <span className="text-[13px] font-medium text-white truncate">{active ? active.title : 'Notepad'}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {active ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="p-1.5 text-[#8a8c91] hover:text-white hover:bg-[#2a2b2e] rounded transition"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#1e1f21] border border-[#333438] rounded-lg shadow-xl p-1 z-10 text-white">
                  {[
                    { icon: Pencil, label: 'Rename', run: startRename, cls: '' },
                    { icon: FileDown, label: 'Convert to PDF', run: exportPdf, cls: '' },
                    { icon: FileText, label: 'Convert to Word', run: exportWord, cls: '' },
                    { icon: Trash2, label: 'Delete', run: deleteNote, cls: 'text-red-400' },
                  ].map((it) => (
                    <button
                      key={it.label}
                      onClick={() => { setMenuOpen(false); it.run(); }}
                      className={`w-full flex items-center px-2 py-1.5 rounded-md text-[13px] hover:bg-[#2a2b2e] ${it.cls}`}
                    >
                      <it.icon className="h-3.5 w-3.5 mr-2" /> {it.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button onClick={addNote} className="p-1.5 text-[#8a8c91] hover:text-white hover:bg-[#2a2b2e] rounded transition" title="New note">
              <Plus className="h-4 w-4" />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 text-[#8a8c91] hover:text-white hover:bg-[#2a2b2e] rounded transition">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {active ? (
        <textarea
          value={active.content}
          onChange={(e) => update(active.id, { content: e.target.value })}
          placeholder="Start typing..."
          autoFocus
          className="w-full h-80 bg-transparent text-[#e5e5e5] p-4 text-[14px] outline-none resize-none placeholder:text-[#8a8c91]"
        />
      ) : (
        <div className="h-80 overflow-y-auto p-2">
          {notes.length === 0 ? (
            <p className="text-[13px] text-[#8a8c91] p-4 text-center">No notes yet. Click + to create one.</p>
          ) : (
            [...notes].sort((a, b) => b.updatedAt - a.updatedAt).map((n) => (
              <button
                key={n.id}
                onClick={() => setActiveId(n.id)}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-[#2a2b2e] transition"
              >
                <div className="text-[13px] text-white truncate">{n.title}</div>
                <div className="text-[12px] text-[#8a8c91] truncate">{n.content.split('\n')[0] || 'Empty note'}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
