'use client';

import { usePathname } from 'next/navigation';
import { Bell, RefreshCw, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/lib/store/hooks';
import { baseApi } from '@/lib/store/api/base-api';
import { useTheme } from '@/components/theme/ThemeProvider';

const PAGE_TITLES: Record<string, string> = {
  '/overview': 'Overview',
  '/sq-requests': 'SQ Requests',
  '/edr': 'EDR Queue',
  '/franchise': 'Franchises',
  '/rule-engine': 'Rule Engine',
  '/criteria': 'Criteria',
  '/platforms': 'Platforms',
  '/audit': 'Audit Logs',
};

function getPageTitle(pathname: string): string {
  // Check exact match
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Check prefix match for nested routes
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(path + '/')) return title;
  }
  return 'PSS Admin';
}

export function Topbar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { theme, toggleTheme } = useTheme();

  const handleRefresh = () => {
    dispatch(baseApi.util.invalidateTags(['SqRequest', 'EdrReview', 'Franchise', 'Stats']));
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{getPageTitle(pathname)}</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">PSS Platform Support Services</p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          title="Refresh data"
          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Notifications"
          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <Bell className="h-4 w-4" />
        </Button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
          A
        </div>
      </div>
    </header>
  );
}
