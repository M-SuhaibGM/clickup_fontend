'use client';

import Link from 'next/link';

import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';


export default function OverviewPage() {
  
  const projects = useProjectStore((s) => s.projects);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here's what's happening in your workspace.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 p-12 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
            <svg className="h-7 w-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">No projects yet</h2>
          <p className="text-sm text-gray-500 mb-5">
            Create your first project using the <span className="font-semibold">+</span> button in the sidebar.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Your Projects</h2>
            <span className="text-xs text-gray-500">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/60 transition"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="h-3 w-3 rounded-full shrink-0 mt-1" style={{ backgroundColor: p.color }} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition">
                      {p.name}
                    </h3>
                    {p.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    {p._count?.lists ?? 0} lists
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}