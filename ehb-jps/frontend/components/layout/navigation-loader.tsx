'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Shows a frosted-glass spinner inside the content area during
 * client-side page navigation (same pattern as ehb-pss).
 */
export function NavigationLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const currentPathRef = useRef(pathname);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href') ?? '';
      if (
        !href ||
        href.startsWith('http') ||
        href.startsWith('//') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:')
      )
        return;
      if (href === currentPathRef.current) return;
      setLoading(true);
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  useEffect(() => {
    currentPathRef.current = pathname;
    setLoading(false);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div
      aria-label="Loading page"
      role="status"
      className="absolute inset-0 z-50 flex items-center justify-center
                 backdrop-blur-[3px] bg-white/40"
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100
                      bg-white/80 px-10 py-8 shadow-xl shadow-gray-200/60">
        <span className="relative flex h-12 w-12 items-center justify-center">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="#E5E7EB" strokeWidth="4" />
          </svg>
          <svg
            className="absolute inset-0 h-full w-full animate-spin"
            viewBox="0 0 48 48"
            fill="none"
            style={{ animationDuration: '700ms' }}
          >
            <circle
              cx="24" cy="24" r="20"
              stroke="#0d9488" strokeWidth="4" strokeLinecap="round"
              strokeDasharray="30 96" strokeDashoffset="0"
            />
          </svg>
        </span>
        <p className="text-[13px] font-medium tracking-wide text-gray-400">Loading…</p>
      </div>
    </div>
  );
}
