'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProjectStore } from '@/store/projectStore';
import { useState } from 'react';
import NewProjectModal from './NewProjectModal';

export default function Sidebar() {
  const pathname = usePathname();
  const projects = useProjectStore((s) => s.projects);
  const loading = useProjectStore((s) => s.loading);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <aside className="w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col h-screen">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-md shadow-indigo-200 transition-transform group-hover:scale-105">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">ClickUp Clone</p>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">Workspace</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
              pathname === '/dashboard'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Overview
          </Link>

          {/* Projects */}
          <div className="pt-5">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">
                Projects
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded p-1 transition"
                title="New project"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {loading && projects.length === 0 ? (
              // Skeleton for projects loading
              <div className="space-y-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-gray-200 shrink-0" />
                    <span className="h-4 bg-gray-200 rounded flex-1" />
                    <span className="h-3 w-3 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400 italic">
                No projects yet. Click + to create one.
              </div>
            ) : (
              <ul className="space-y-0.5">
                {projects.map((p) => {
                  const active = pathname === `/projects/${p.id}`;
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/projects/${p.id}`}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                          active
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="truncate flex-1">{p.name}</span>
                        
                        {/* Show number of lists */}
                        <span className="text-[10px] text-gray-400">
                          {p._count?.lists ?? 0}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-[10px] text-gray-400">
            ClickUp Clone · v0.2 · Phase 2
          </p>
        </div>
      </aside>

      <NewProjectModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}