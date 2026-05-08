'use client';

import Link from 'next/link';
import { useGetProductByIdQuery, useSubmitForSQMutation, useGetSQStatusQuery } from '@/lib/store/api/products.api';
import { toast } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SqStatusPill } from '@/components/sq/sq-status-pill';
import { SqBadge } from '@/components/sq/sq-badge';
import { SqTimeline } from '@/components/sq/sq-timeline';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, Send, RefreshCw, CheckCircle2, AlertCircle, ListChecks } from 'lucide-react';

const CRITERIA_CHECKLIST = [
  { id: 'c1', label: 'Product title present', field: 'title' },
  { id: 'c2', label: 'Description (min 20 chars)', field: 'description' },
  { id: 'c3', label: 'Price is set (≥ 1 PKR)', field: 'price' },
  { id: 'c4', label: 'At least 1 image', field: 'images' },
  { id: 'c5', label: 'Category selected', field: 'category' },
];

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: product, isLoading, refetch } = useGetProductByIdQuery(id);
  const [submitSQ, { isLoading: isSubmitting }] = useSubmitForSQMutation();
  const { refetch: refetchSqStatus } = useGetSQStatusQuery(id, { skip: !product });

  const handleSubmitSQ = async () => {
    if (!product) return;
    try {
      const res = await submitSQ(id).unwrap();
      toast({ title: 'Submitted for SQ approval!', description: `Request ID: ${res.sq_request_id ?? 'N/A'}` });
      refetch();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast({ title: 'Submission failed', description: e?.data?.message ?? 'Try again', variant: 'destructive' });
    }
  };

  const handleRefreshStatus = async () => {
    // IMPORTANT: Sequential, not parallel. The /sq-status endpoint pulls the
    // authoritative status from PSS and reconciles it into the product
    // document. Only after that write completes can we safely refetch the
    // product and see the fresh state. Running them in parallel (old bug)
    // would race — refetch could return the stale doc before sq-status
    // finished writing.
    const before = product?.sq_status;
    await refetchSqStatus();
    const res = await refetch();
    const after = res.data?.sq_status;
    if (before && after && before !== after) {
      toast({
        title: 'Status updated',
        description: `${before} → ${after}`,
      });
    } else {
      toast({ title: 'Status refreshed', description: 'No change yet.' });
    }
  };

  if (isLoading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  if (!product) return <p className="text-muted-foreground">Product not found.</p>;

  const isPending = ['pending', 'pending_franchise', 'pending_edr'].includes(product.sq_status);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        </Link>
        <h1 className="text-2xl font-bold truncate">{product.title}</h1>
      </div>

      {/* Product info */}
      <Card>
        <CardHeader><CardTitle>Product Info</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <SqStatusPill status={product.sq_status} />
            <SqBadge level={product.sq_level} label={product.sq_badge_label} />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Price:</span> <strong>{formatPrice(product.price)}</strong></div>
            <div><span className="text-muted-foreground">Category:</span> <strong>{product.category}</strong></div>
            <div><span className="text-muted-foreground">Stock:</span> <strong>{product.stock}</strong></div>
            <div><span className="text-muted-foreground">Images:</span> <strong>{product.images.length}</strong></div>
          </div>
          <p className="text-sm text-muted-foreground">{product.description}</p>
        </CardContent>
      </Card>

      {/* SQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            SQ Approval
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* NOT SUBMITTED */}
          {product.sq_status === 'not_submitted' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This product has not been submitted for SQ approval.
                PSS will evaluate the following criteria:
              </p>
              <div className="space-y-2">
                {CRITERIA_CHECKLIST.map(({ id: cid, label, field }) => {
                  const fieldVal = (product as unknown as Record<string, unknown>)[field];
                  const passed = field === 'images'
                    ? Array.isArray(fieldVal) && fieldVal.length > 0
                    : field === 'description'
                    ? typeof fieldVal === 'string' && fieldVal.length >= 20
                    : !!fieldVal;
                  return (
                    <div key={cid} className="flex items-center gap-2 text-sm">
                      {passed
                        ? <CheckCircle2 className="h-4 w-4 text-success-500" />
                        : <AlertCircle className="h-4 w-4 text-yellow-500" />}
                      <span className={passed ? '' : 'text-muted-foreground'}>{label}</span>
                    </div>
                  );
                })}
              </div>
              <Button onClick={handleSubmitSQ} disabled={isSubmitting} className="w-full" size="lg">
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Send for Approval'}
              </Button>
            </div>
          )}

          {/* PENDING */}
          {isPending && (
            <div className="space-y-4">
              <SqTimeline status={product.sq_status} sqRequestId={product.sq_request_id} />
              <Button variant="outline" onClick={handleRefreshStatus} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />Refresh Status
              </Button>
            </div>
          )}

          {/* APPROVED */}
          {product.sq_status === 'approved' && (
            <div className="space-y-3 text-center py-2">
              <div className="flex justify-center">
                <SqBadge level={product.sq_level} label={product.sq_badge_label} size="lg" />
              </div>
              <p className="text-sm text-success-700 font-medium">Your product is now visible to buyers</p>
              {product.sq_decided_at && (
                <p className="text-xs text-muted-foreground">
                  Approved on {new Date(product.sq_decided_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* REJECTED */}
          {product.sq_status === 'rejected' && (
            <div className="space-y-4">
              <div className="rounded-md bg-destructive/10 border border-destructive/30 p-4">
                <p className="text-sm font-medium text-destructive mb-1">Rejection Reason</p>
                <p className="text-sm text-destructive">{product.sq_rejection_reason ?? 'No reason provided'}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Fix the issues above, then resubmit for approval.
              </p>
              <Button onClick={handleSubmitSQ} disabled={isSubmitting} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Resubmit for Approval'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
