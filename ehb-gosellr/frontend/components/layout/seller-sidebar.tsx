'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, ShieldCheck, Plus, Settings } from 'lucide-react';

const links = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'My Products', icon: Package },
  { href: '/dashboard/products/new', label: 'Add Product', icon: Plus },
  { href: '/dashboard/sq-status', label: 'SQ Status', icon: ShieldCheck },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function SellerSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 border-r min-h-screen p-4 space-y-1">
      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider px-2 mb-3">Seller Portal</p>
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
            pathname === href ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground',
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </aside>
  );
}
