'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  HelpCircle,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { clearCredentials } from '@/lib/store/auth.slice';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'My Profiles', href: '/dashboard',  icon: LayoutDashboard },
  { label: 'Settings',    href: '/settings',   icon: Settings },
  { label: 'Support',     href: '/support',    icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [collapsed, setCollapsed] = useState(false);

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  function handleLogout() {
    dispatch(clearCredentials());
    router.replace(
      `${process.env.NEXT_PUBLIC_EHB_URL ?? 'http://localhost:4000'}/login?redirect=jps`,
    );
  }

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-200',
        collapsed ? 'w-[60px]' : 'w-[220px]',
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex h-14 items-center border-b border-gray-100 px-4',
          collapsed ? 'justify-center' : 'gap-2.5',
        )}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white font-bold text-xs">
          J
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 leading-tight">
              JPS
            </p>
            <p className="truncate text-[11px] text-gray-400 leading-tight">
              Job Providing Service
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
              item.href === '/dashboard'
                ? pathname === '/dashboard' || pathname.startsWith('/profiles')
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isActive ? 'text-blue-600' : 'text-gray-400',
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
      <div className="border-t border-gray-100 px-2 py-2 space-y-0.5">
        {/* User info */}
        {!collapsed && user && (
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-gray-800">{user.full_name}</p>
              <p className="truncate text-[10px] text-gray-400">{user.email}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign Out' : undefined}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors',
            collapsed && 'justify-center px-0',
          )}
        >
          <LogOut className="h-4 w-4 shrink-0 text-gray-400" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4 shrink-0 text-gray-400" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4 shrink-0 text-gray-400" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
