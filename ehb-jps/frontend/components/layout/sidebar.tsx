'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import { useAppDispatch } from '@/lib/store/hooks';
import { clearCredentials } from '@/lib/store/auth.slice';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const MAIN_NAV: NavItem[] = [
  { label: 'My Profiles', href: '/dashboard', icon: LayoutDashboard },
];

const ACCOUNT_NAV: NavItem[] = [
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Support',  href: '/support',  icon: HelpCircle },
];

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const isActive =
    item.href === '/dashboard'
      ? pathname === '/dashboard' || pathname.startsWith('/profiles')
      : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-teal-50 text-teal-700'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800',
      )}
    >
      <Icon
        className={cn(
          'h-[18px] w-[18px] shrink-0',
          isActive ? 'text-teal-600' : 'text-gray-400',
        )}
      />
      <span>{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  function handleLogout() {
    dispatch(clearCredentials());
    router.replace(
      `${process.env.NEXT_PUBLIC_EHB_URL ?? 'http://localhost:4000'}/login?redirect=jps`,
    );
  }

  return (
    <aside className="flex h-full w-[230px] shrink-0 flex-col border-r border-gray-100 bg-white">

      {/* ── Logo ── */}
      <div className="flex h-16 items-center border-b border-gray-100 px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white font-bold text-sm shadow-sm">
            J
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-gray-900">JPS</p>
            <p className="text-[10px] text-gray-400">Job Providing Service</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6">

        {/* Main Menu */}
        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
            Main Menu
          </p>
          <ul className="space-y-0.5">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <NavLink item={item} pathname={pathname} />
              </li>
            ))}
          </ul>
        </div>

        {/* Account Management */}
        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
            Account Management
          </p>
          <ul className="space-y-0.5">
            {ACCOUNT_NAV.map((item) => (
              <li key={item.href}>
                <NavLink item={item} pathname={pathname} />
              </li>
            ))}
          </ul>
        </div>

      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-gray-100 px-3 py-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition-all duration-150 hover:bg-gray-50 hover:text-gray-800"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 text-gray-400" />
          <span>Log out</span>
        </button>
      </div>

    </aside>
  );
}
