import Link from 'next/link';
import { ShieldCheck, ShieldAlert, User, ExternalLink } from 'lucide-react';
import type { ProductOwner } from '@/lib/store/api/products.api';

const JPS_FRONTEND_URL =
  process.env.NEXT_PUBLIC_JPS_FRONTEND_URL ?? 'http://localhost:4006';

const STATUS_COPY: Record<string, { tone: string; label: string }> = {
  approved: { tone: 'text-success-700 bg-success-50 border-success-100', label: 'Verified by JPS' },
  draft: { tone: 'text-yellow-700 bg-yellow-50 border-yellow-200', label: 'Identity pending verification' },
  submitted: { tone: 'text-blue-700 bg-blue-50 border-blue-200', label: 'Identity verification in progress' },
  under_review: { tone: 'text-blue-700 bg-blue-50 border-blue-200', label: 'Identity under review' },
  rejected: { tone: 'text-red-700 bg-red-50 border-red-200', label: 'Identity not verified' },
  resubmit_required: { tone: 'text-orange-700 bg-orange-50 border-orange-200', label: 'Awaiting re-submission' },
};

/**
 * Buyer-facing "Owner" sub-section, rendered INSIDE the Store card on the
 * product detail page. Shows the JPS profile of the human behind the store
 * with their SQ badge / verification status and a deep-link to the full
 * JPS profile page.
 *
 * If `owner` is null (no JPS profile linked, or JPS unreachable at render
 * time), the component renders a soft placeholder rather than nothing — the
 * sub-section is meant to be visible at all times so its absence doesn't
 * surprise buyers.
 */
export function OwnerSubsection({ owner }: { owner: ProductOwner | null | undefined }) {
  if (!owner) {
    return (
      <div className="border-t border-border pt-3 mt-3">
        <p className="text-xs font-semibold text-muted-foreground mb-1">Owner</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          <span>Owner identity not yet linked.</span>
        </div>
      </div>
    );
  }

  const status = STATUS_COPY[owner.status] ?? { tone: 'text-gray-700 bg-gray-50 border-gray-200', label: owner.status };
  const Icon = owner.is_verified ? ShieldCheck : ShieldAlert;

  return (
    <div className="border-t border-border pt-3 mt-3">
      <p className="text-xs font-semibold text-muted-foreground mb-1">Owner</p>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${owner.is_verified ? 'bg-success-50 text-success-700' : 'bg-blue-50 text-blue-700'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground truncate">{owner.display_name}</p>
            <span className="text-xs text-muted-foreground capitalize">· {owner.role}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold border rounded-full px-2 py-0.5 ${status.tone}`}>
              {status.label}
            </span>
            {owner.sq_badge_label && (
              <span className="text-xs font-semibold border border-success-100 bg-success-50 text-success-700 rounded-full px-2 py-0.5">
                {owner.sq_badge_label}
              </span>
            )}
          </div>
          {owner.bio && (
            <p className="text-xs text-muted-foreground line-clamp-2 pt-0.5">{owner.bio}</p>
          )}
          <Link
            href={`${JPS_FRONTEND_URL}/profiles/${owner.id}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-accent hover:text-accent-700 inline-flex items-center gap-1 pt-1"
          >
            View full profile <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
