'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  useGetEligibleJpsProfilesQuery,
  useGetLinkedJpsProfileQuery,
  useGetSellerProfileQuery,
  useAttachJpsProfileMutation,
  useAutoAttachLatestJpsProfileMutation,
  useUnlinkJpsProfileMutation,
  type EligibleJpsProfile,
} from '@/lib/store/api/seller.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toaster';
import {
  ShieldCheck, ExternalLink, Link2, Link2Off, AlertCircle, Loader2, Plus, Check,
} from 'lucide-react';

const JPS_FRONTEND_URL =
  process.env.NEXT_PUBLIC_JPS_FRONTEND_URL ?? 'http://localhost:4006';

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  draft: { label: 'Draft', tone: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  submitted: { label: 'Pending verification', tone: 'bg-blue-50 text-blue-700 border-blue-200' },
  under_review: { label: 'Under review', tone: 'bg-blue-50 text-blue-700 border-blue-200' },
  approved: { label: 'Verified', tone: 'bg-success-50 text-success-700 border-success-100' },
  rejected: { label: 'Rejected', tone: 'bg-red-50 text-red-700 border-red-200' },
  resubmit_required: { label: 'Resubmit required', tone: 'bg-orange-50 text-orange-700 border-orange-200' },
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_LABELS[status] ?? { label: status, tone: 'bg-gray-50 text-gray-600 border-gray-200' };
  return (
    <span className={`text-xs font-semibold border rounded-full px-2 py-0.5 ${cfg.tone}`}>
      {cfg.label}
    </span>
  );
}

export default function JpsProfilePage() {
  const search = useSearchParams();
  const router = useRouter();
  const fromJps = search.get('from') === 'jps';

  const { data: seller, isLoading: sellerLoading } = useGetSellerProfileQuery();
  const { data: linked, isLoading: linkedLoading } =
    useGetLinkedJpsProfileQuery(undefined, {
      // Fetch only after we know the seller has a profile id, otherwise the
      // query stays uninitialised — RTK Query refuses refetch() on skipped
      // queries, and invalidatesTags: ['Seller'] already chains us when a
      // mutation completes.
      skip: !seller?.jps_profile_id,
    });

  const [attach, { isLoading: attaching }] = useAttachJpsProfileMutation();
  const [autoAttach, { isLoading: autoAttaching }] = useAutoAttachLatestJpsProfileMutation();
  const [unlink, { isLoading: unlinking }] = useUnlinkJpsProfileMutation();

  const [pickerOpen, setPickerOpen] = useState(false);
  const { data: eligible, isFetching: eligibleLoading } =
    useGetEligibleJpsProfilesQuery(undefined, { skip: !pickerOpen });

  // ── Deep-link return flow ────────────────────────────────────────────────
  // When the user comes back from JPS with ?from=jps, auto-attach their newest
  // unlinked gosellr+seller profile. Triggered exactly once per visit.
  const [autoTried, setAutoTried] = useState(false);
  useEffect(() => {
    if (!fromJps || autoTried || sellerLoading) return;
    if (seller?.jps_profile_id) return; // Already linked — nothing to do
    setAutoTried(true);
    (async () => {
      try {
        await autoAttach().unwrap();
        toast({
          title: 'Linked!',
          description: 'Your new JPS profile is attached to this seller account.',
        });
        // Clean up the URL so a refresh doesn't trigger the flow again.
        router.replace('/dashboard/jps-profile');
      } catch (err: unknown) {
        const e = err as { data?: { message?: string } };
        toast({
          title: 'Auto-link failed',
          description:
            e?.data?.message ??
            'Could not auto-attach the new JPS profile. Try the "Attach existing" button.',
          variant: 'destructive',
        });
      }
    })();
  }, [fromJps, autoTried, sellerLoading, seller, autoAttach, router]);

  const linkedSummary = useMemo(() => {
    if (!linked) return null;
    return {
      id: linked._id,
      display_name: linked.display_name,
      role: linked.role,
      bio: linked.bio,
      sq_level: linked.sq_level,
      status: linked.status,
    };
  }, [linked]);

  const createNewUrl = (() => {
    const ret = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4002'}/dashboard/jps-profile?from=jps`;
    const params = new URLSearchParams({
      platform: 'gosellr',
      role: 'seller',
      return_to: ret,
    });
    return `${JPS_FRONTEND_URL}/profiles/new?${params.toString()}`;
  })();

  async function handleAttach(profileId: string) {
    try {
      await attach({ jps_profile_id: profileId }).unwrap();
      toast({ title: 'Linked!', description: 'JPS profile attached to this seller account.' });
      setPickerOpen(false);
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast({
        title: 'Could not attach',
        description: e?.data?.message ?? 'Attach failed',
        variant: 'destructive',
      });
    }
  }

  async function handleUnlink() {
    if (!confirm('Unlink this JPS profile? You will need to relink before uploading more products.')) return;
    try {
      await unlink().unwrap();
      toast({ title: 'Unlinked', description: 'JPS profile detached from this seller account.' });
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast({
        title: 'Cannot unlink',
        description: e?.data?.message ?? 'Unlink failed',
        variant: 'destructive',
      });
    }
  }

  if (sellerLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-accent" />
          JPS Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Buyers see this profile alongside your store on every product. You must link a JPS
          profile before uploading products.
        </p>
      </div>

      {/* ── Linked state ─────────────────────────────────────────────────── */}
      {seller?.jps_profile_id ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Linked profile</span>
              {linkedSummary && <StatusPill status={linkedSummary.status} />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {linkedLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : linkedSummary ? (
              <>
                <div>
                  <p className="text-lg font-bold text-foreground">{linkedSummary.display_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    Role: {linkedSummary.role} · Platform: gosellr
                  </p>
                </div>
                {linkedSummary.bio && (
                  <p className="text-sm text-foreground/80">{linkedSummary.bio}</p>
                )}
                {linkedSummary.sq_level !== null && (
                  <div className="text-xs font-semibold text-success-700 bg-success-50 border border-success-100 rounded px-2 py-1 w-fit">
                    SQ Level {linkedSummary.sq_level}
                  </div>
                )}
                {linkedSummary.status !== 'approved' && (
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded p-3">
                    <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">
                      Your JPS profile is not yet fully verified. Buyers will see a "Pending
                      verification" pill until JPS approves your profile.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Profile metadata unavailable (JPS may be down). Linkage is intact — buyers will
                see a generic owner card until JPS responds.
              </p>
            )}
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={`${JPS_FRONTEND_URL}/profiles/${seller.jps_profile_id}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1" /> Open in JPS
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUnlink}
                disabled={unlinking}
                className="text-destructive hover:text-destructive"
              >
                {unlinking ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Link2Off className="w-4 h-4 mr-1" />}
                Unlink
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ── Unlinked state ─────────────────────────────────────────────── */
        <Card className="border-2 border-dashed border-orange-200 bg-orange-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="w-5 h-5" /> No JPS profile linked
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-foreground/80">
              You need a JPS profile (platform <strong>gosellr</strong>, role <strong>seller</strong>)
              to upload products. Pick one of these options:
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setPickerOpen(true)}
                disabled={autoAttaching}
              >
                <Link2 className="w-4 h-4 mr-1" /> Attach existing JPS profile
              </Button>
              <Button asChild variant="outline">
                <a href={createNewUrl} target="_blank" rel="noreferrer">
                  <Plus className="w-4 h-4 mr-1" /> Create new in JPS
                </a>
              </Button>
            </div>
            {autoAttaching && (
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Auto-attaching your new profile…
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Picker modal (inline panel) ────────────────────────────────── */}
      {pickerOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pick a JPS profile</span>
              <button
                onClick={() => setPickerOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eligibleLoading ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : !eligible || eligible.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You don&apos;t have any eligible JPS profiles yet. Use{' '}
                <a href={createNewUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                  Create new in JPS
                </a>{' '}
                instead.
              </p>
            ) : (
              <div className="space-y-2">
                {eligible.map((p: EligibleJpsProfile) => (
                  <div
                    key={p.id}
                    className="border border-border rounded-lg p-3 flex items-start justify-between gap-3 hover:bg-surface-alt/50"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground truncate">{p.display_name}</p>
                        <StatusPill status={p.status} />
                        {p.sq_level !== null && (
                          <span className="text-xs bg-success-50 text-success-700 border border-success-100 rounded px-2 py-0.5">
                            SQ {p.sq_level}
                          </span>
                        )}
                      </div>
                      {p.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.bio}</p>}
                      {p.already_linked && !p.linked_to_me && (
                        <p className="text-xs text-red-600 mt-1">
                          Already linked to a different GoSellr account
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAttach(p.id)}
                      disabled={attaching || (p.already_linked && !p.linked_to_me)}
                    >
                      {attaching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                      Attach
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        <Link href="/dashboard" className="hover:underline">← Back to dashboard</Link>
      </p>
    </div>
  );
}
