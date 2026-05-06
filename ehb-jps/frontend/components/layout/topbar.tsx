'use client';

import { usePathname } from 'next/navigation';
import { Bell, Mail, ChevronDown, RefreshCw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { profilesApi } from '@/lib/store/api/profiles.api';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'My Profiles',  subtitle: 'Manage your professional profiles' },
  '/profiles':  { title: 'My Profiles',  subtitle: 'Manage your professional profiles' },
  '/settings':  { title: 'Settings',     subtitle: 'Your account settings' },
  '/support':   { title: 'Support',      subtitle: 'Help and frequently asked questions' },
};

function getPageMeta(pathname: string): { title: string; subtitle: string } {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [path, meta] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(path + '/')) return meta;
  }
  return { title: 'JPS', subtitle: 'Job Providing Service' };
}

export function Topbar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const { title, subtitle } = getPageMeta(pathname);

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  function handleRefresh() {
    dispatch(profilesApi.util.invalidateTags(['Profile']));
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-white px-6">

      {/* Left: title */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900 leading-tight">{title}</h1>
        <p className="text-xs text-gray-400 leading-tight">{subtitle}</p>
      </div>

      {/* Right: actions + user */}
      <div className="flex items-center gap-2">

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          title="Refresh data"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        {/* Mail */}
        <button
          title="Messages"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
        >
          <Mail className="h-4 w-4" />
        </button>

        {/* Bell */}
        <button
          title="Notifications"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-gray-100" />

        {/* User */}
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-xs font-semibold">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-gray-800 leading-tight">{user.full_name}</p>
              <p className="text-[10px] text-gray-400 leading-tight truncate max-w-[140px]">
                {user.email}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </div>
        )}
      </div>

    </header>
  );
}
