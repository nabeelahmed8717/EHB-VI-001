import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SqStatus } from '@/lib/store/api/products.api';

interface SqTimelineProps {
  status: SqStatus;
  decidedBy?: string | null;
  sqRequestId?: string | null;
}

type StepState = 'complete' | 'active' | 'pending';

function getSteps(status: SqStatus): [StepState, StepState, StepState] {
  switch (status) {
    case 'pending':
      return ['complete', 'active', 'pending'];
    case 'pending_franchise':
    case 'pending_edr':
      return ['complete', 'active', 'pending'];
    case 'approved':
    case 'rejected':
      return ['complete', 'complete', 'complete'];
    default:
      return ['pending', 'pending', 'pending'];
  }
}

function getStep2Label(status: SqStatus): string {
  if (status === 'pending_franchise') return 'Franchise Review';
  if (status === 'pending_edr') return 'EDR Review';
  return 'Under Review';
}

function StepIcon({ state }: { state: StepState }) {
  if (state === 'complete') return <CheckCircle2 className="h-6 w-6 text-success-500" />;
  if (state === 'active') return <Clock className="h-6 w-6 text-yellow-500 animate-pulse" />;
  return <Circle className="h-6 w-6 text-muted-foreground" />;
}

export function SqTimeline({ status, decidedBy, sqRequestId }: SqTimelineProps) {
  const [s1, s2, s3] = getSteps(status);

  const steps = [
    { label: 'Submitted to PSS', state: s1 },
    { label: getStep2Label(status), state: s2 },
    { label: 'Decision Made', state: s3 },
  ];

  return (
    <div className="space-y-3">
      {sqRequestId && (
        <p className="text-xs text-muted-foreground font-mono">
          Request ID: {sqRequestId}
        </p>
      )}
      <div className="flex items-start gap-4">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <StepIcon state={step.state} />
            <p className={cn('text-xs text-center', step.state === 'pending' ? 'text-muted-foreground' : 'text-foreground font-medium')}>
              {step.label}
            </p>
            {i < steps.length - 1 && (
              <div className={cn('h-0.5 w-full mt-2', step.state === 'complete' ? 'bg-success-500' : 'bg-surface-muted')} />
            )}
          </div>
        ))}
      </div>
      {decidedBy && (
        <p className="text-xs text-muted-foreground">
          Decided by: <span className="font-medium capitalize">{decidedBy}</span>
        </p>
      )}
    </div>
  );
}
