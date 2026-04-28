import { getSqLevelColor, getSqLevelLabel, cn } from '@/lib/utils';

interface SqBadgeProps {
  level: number | null | undefined;
  className?: string;
}

export function SqBadge({ level, className }: SqBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        getSqLevelColor(level),
        className,
      )}
    >
      {getSqLevelLabel(level)}
    </span>
  );
}
