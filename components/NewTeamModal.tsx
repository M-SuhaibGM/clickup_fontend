// frontend/components/NewTeamModal.tsx
'use client';

import { useState } from 'react';
import { X, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NewTeamModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success(`Team "${name}" created!`);
      setSaving(false);
      setName('');
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-[color:var(--c-1e1f21)] border border-[color:var(--c-333438)] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[color:var(--c-white)] flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" /> Create a Team
          </h2>
          <button onClick={onClose} className="text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)] transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[color:var(--c-8a8c91)] mb-1.5">Team Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering, Design, Marketing"
              className="w-full rounded-lg border border-[color:var(--c-333438)] bg-[color:var(--c-121212)] px-3 py-2.5 text-sm text-[color:var(--c-white)] focus:border-indigo-500 outline-none transition"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[color:var(--c-333438)] py-2.5 text-sm font-medium text-[color:var(--c-white)] hover:bg-[color:var(--c-2a2b2e)] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}