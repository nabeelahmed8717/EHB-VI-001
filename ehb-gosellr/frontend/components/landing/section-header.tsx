import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}

/**
 * Standard "section title row" used throughout the landing page and other
 * GoSellr modules. Title left, optional "View All →" link right.
 */
export function SectionHeader({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = 'View All',
}: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4 md:mb-5">
      <div className="min-w-0">
        <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="text-sm font-semibold text-accent hover:text-accent-700 transition-colors flex items-center gap-1 shrink-0"
        >
          {viewAllLabel}
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
