import { cn, getAuditActionColor } from '@/lib/utils';
import type { AuditAction } from '@/types/pss.types';

interface AuditActionBadgeProps {
  action: AuditAction | string;
  className?: string;
}

export function AuditActionBadge({ action, className }: AuditActionBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        getAuditActionColor(action),
        className,
      )}
    >
      {action}
    </span>
  );
}
