'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const SEGMENT_LABELS: Record<string, string> = {
  overview: 'Overview',
  'sq-requests': 'SQ Requests',
  edr: 'EDR',
  franchise: 'Franchises',
  'rule-engine': 'Rule Engine',
  criteria: 'Criteria',
  platforms: 'Platforms',
  audit: 'Audit Logs',
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/');
    const label = SEGMENT_LABELS[seg] ?? seg;
    const isLast = idx === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav className="flex items-center gap-1 px-6 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
      <Link href="/overview" className="hover:text-gray-900 dark:hover:text-gray-100 flex items-center">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5" />
          {crumb.isLast ? (
            <span className={cn('font-medium text-gray-900 dark:text-gray-100')}>{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-gray-900 dark:hover:text-gray-100">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
