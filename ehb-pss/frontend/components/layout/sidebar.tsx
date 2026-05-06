'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  FileSearch,
  Shield,
  Building2,
  Settings2,
  ClipboardList,
  Globe,
  ScrollText,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview',     href: '/overview',     icon: LayoutDashboard },
  { label: 'SQ Requests',  href: '/sq-requests',  icon: FileSearch },
  { label: 'EDR Queue',    href: '/edr',          icon: Shield },
  { label: 'Franchises',   href: '/franchise',    icon: Building2 },
  { label: 'Rule Engine',  href: '/rule-engine',  icon: Settings2 },
  { label: 'Criteria',     href: '/criteria',     icon: ClipboardList },
  { label: 'Platforms',    href: '/platforms',    icon: Globe },
  { label: 'Audit Logs',   href: '/audit',        icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-200',
        collapsed ? 'w-[60px]' : 'w-[220px]',
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex h-14 items-center border-b border-gray-100 dark:border-gray-800 px-4',
          collapsed ? 'justify-center' : 'gap-2.5',
        )}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white font-bold text-xs">
          P
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              PSS Admin
            </p>
            <p className="truncate text-[11px] text-gray-400 dark:text-gray-500 leading-tight">
              EHB Platform Services
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/overview' && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500',
                    )}
                  />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 dark:border-gray-800 px-2 py-2 space-y-0.5">
        {/* Sign Out */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={collapsed ? 'Sign Out' : undefined}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 transition-colors',
            collapsed && 'justify-center px-0',
          )}
        >
          <LogOut className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 transition-colors',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
