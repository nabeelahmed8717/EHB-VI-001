'use client';

import { usePathname } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { useAppDispatch } from '@/lib/store/hooks';
import { profilesApi } from '@/lib/store/api/profiles.api';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'My Profiles',
  '/profiles': 'My Profiles',
  '/settings': 'Settings',
  '/support': 'Support',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(path + '/')) return title;
  }
  return 'JPS';
}

export function Topbar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  function handleRefresh() {
    dispatch(profilesApi.util.invalidateTags(['Profile']));
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-6">
      <div>
        <h1 className="text-base font-semibold text-gray-900">{getPageTitle(pathname)}</h1>
      </div>
      <button
        onClick={handleRefresh}
        title="Refresh data"
        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
      </button>
    </header>
  );
}
