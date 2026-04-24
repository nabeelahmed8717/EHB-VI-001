import { cn, getSqStatusColor, getSqStatusLabel } from '@/lib/utils';
import type { SqStatus } from '@/types/pss.types';

interface SqStatusPillProps {
  status: SqStatus | string;
  className?: string;
}

export function SqStatusPill({ status, className }: SqStatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        getSqStatusColor(status),
        className,
      )}
    >
      {getSqStatusLabel(status)}
    </span>
  );
}
