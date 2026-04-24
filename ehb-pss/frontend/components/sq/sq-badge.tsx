import { cn, getSqLevelColor, getSqLevelLabel } from '@/lib/utils';
import type { SqLevel } from '@/types/pss.types';

interface SqBadgeProps {
  level: SqLevel | number | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SqBadge({ level, className, size = 'md' }: SqBadgeProps) {
  const colorClass = getSqLevelColor(level);
  const label = level !== null && level !== undefined ? `SQ${level}` : '—';

  const sizeClass = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold',
        colorClass,
        sizeClass,
        className,
      )}
      title={getSqLevelLabel(level)}
    >
      {label}
    </span>
  );
}
