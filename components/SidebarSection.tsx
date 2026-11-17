import Image from 'next/image';
import type { ReactNode } from 'react';

/** Small muted section title used in the sidebar ("Agents", "Spaces", "Channels"…). */
export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-2.5 mt-4 mb-1.5">
      <span className="text-[12.5px] font-semibold text-[color:var(--c-8a8c91)]">{children}</span>
      {action}
    </div>
  );
}

/** The boxed "+" next to a section title. */
export function SectionAddButton({ onClick, title }: { onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="h-6 w-6 flex items-center justify-center rounded-md bg-[color:var(--c-2a2b2e)] text-[color:var(--c-e5e5e5)] hover:bg-[color:var(--c-333438)] hover:text-[color:var(--c-white)] transition"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}

/** "Brain" mark (public/ai-icon.png). */
export function BrainLogo({ size = 20 }: { size?: number }) {
  return <Image src="/ai-icon.png" alt="" width={size} height={size} className="shrink-0" />;
}
