import { getStatusColor, getStatusLabel, cn } from '@/lib/utils';
import type { ProfileStatus } from '@/types/jps.types';

interface StatusBadgeProps {
  status: ProfileStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        getStatusColor(status),
        className,
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}
