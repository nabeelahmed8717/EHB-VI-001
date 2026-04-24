import { cn, getSqColor } from '@/lib/utils';

interface SqBadgeProps {
  level: number | null;
  label?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export function SqBadge({ level, label, size = 'md' }: SqBadgeProps) {
  const colorClass = getSqColor(level);
  const sizeClass = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-4 py-2 font-semibold',
  }[size];

  if (level === null) {
    return (
      <span className={cn('inline-flex items-center rounded-full font-medium', colorClass, sizeClass)}>
        No SQ
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center rounded-full font-medium', colorClass, sizeClass)}>
      {label ?? `SQ${level}`}
    </span>
  );
}
