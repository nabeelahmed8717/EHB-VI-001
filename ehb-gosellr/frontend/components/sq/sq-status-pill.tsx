import { cn, getSqStatusConfig } from '@/lib/utils';
import type { SqStatus } from '@/lib/store/api/products.api';

interface SqStatusPillProps {
  status: SqStatus;
  className?: string;
}

export function SqStatusPill({ status, className }: SqStatusPillProps) {
  const { label, color } = getSqStatusConfig(status);
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', color, className)}>
      {label}
    </span>
  );
}
