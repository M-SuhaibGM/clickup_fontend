'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CircleArrowUp, CreditCard, History, Settings, ShieldCheck, User, Users, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import SidebarHeader from './SidebarHeader';

interface SettingsItem {
  icon: LucideIcon;
  label: string;
  /** Pages that exist link; the rest show a "coming soon" toast. */
  href?: string;
}

const ADMIN_ITEMS: SettingsItem[] = [
  { icon: Settings, label: 'General', href: '/settings' },
  { icon: User, label: 'People', href: '/members' },
  { icon: Users, label: 'Teams', href: '/teams' },
  { icon: CircleArrowUp, label: 'Upgrade', href: '/upgrade' },
  { icon: CreditCard, label: 'Billing' },
  { icon: ShieldCheck, label: 'Security & Permissions' },
  { icon: History, label: 'Audit Logs', href: '/audit-logs' },
];

const row = 'group flex items-center gap-3 w-full px-2.5 py-2 rounded-md transition-colors text-left';
const rowState = (active: boolean) =>
  active
    ? 'bg-[color:var(--c-2a2b2e)] text-[color:var(--c-white)] font-medium'
    : 'text-[color:var(--c-e5e5e5)] hover:bg-[color:var(--c-2a2b2e)]';

/** Shown on Settings, Labs and the admin pages reached from here (Upgrade, Audit Logs). */
export default function SettingsSidebar({ onCollapse }: { onCollapse?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="w-full h-full flex flex-col text-[color:var(--c-e5e5e5)] overflow-hidden">
      <SidebarHeader title="All settings" onCollapse={onCollapse} />

      <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 custom-scrollbar">
        <p className="px-2.5 pt-1 pb-1.5 text-[12px] font-semibold text-[color:var(--c-8a8c91)]">Admin</p>
        {ADMIN_ITEMS.map(({ icon: Icon, label, href }) => {
          const content = (
            <>
              <Icon className="h-4 w-4 shrink-0 text-[color:var(--c-8a8c91)] group-hover:text-[color:var(--c-white)] transition-colors" />
              <span className="text-[14px] truncate">{label}</span>
            </>
          );
          return href ? (
            <Link key={label} href={href} className={`${row} ${rowState(pathname === href || pathname.startsWith(`${href}/`))}`}>
              {content}
            </Link>
          ) : (
            <button key={label} onClick={() => toast.info(`${label} is coming soon`)} className={`${row} ${rowState(false)}`}>
              {content}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
