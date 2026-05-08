'use client';

import Link from 'next/link';
import { useGetProductByIdQuery } from '@/lib/store/api/products.api';
import { SqBadge } from '@/components/sq/sq-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, MessageSquare, Package } from 'lucide-react';

export default function ProductDetailBuyerPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: product, isLoading } = useGetProductByIdQuery(id);

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-80 w-full rounded-lg" />
          <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        </div>
      </div>
    );
  }

  if (!product) return <p className="text-muted-foreground">Product not found.</p>;

  const mainImage = product.images?.[0];

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/browse">
        <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back to Browse</Button>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="rounded-lg overflow-hidden bg-surface-alt h-80 flex items-center justify-center">
          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mainImage} alt={product.title} className="h-full w-full object-cover" />
          ) : (
            <Package className="h-16 w-16 text-muted-foreground" />
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <SqBadge level={product.sq_level} label={product.sq_badge_label} size="md" />
              <span className="text-xs bg-secondary text-secondary-foreground rounded px-2 py-0.5">{product.category}</span>
            </div>
            <h1 className="text-2xl font-bold">{product.title}</h1>
            <p className="text-3xl font-bold text-primary mt-2">{formatPrice(product.price)}</p>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p><span className="font-medium text-foreground">Stock:</span> {product.stock} units available</p>
            {product.sq_decided_at && (
              <p><span className="font-medium text-foreground">SQ Verified:</span> {new Date(product.sq_decided_at).toLocaleDateString()}</p>
            )}
          </div>

          <div className="bg-success-50 border border-success-100 rounded-md p-3">
            <p className="text-xs font-medium text-success-700">✓ SQ Verified Product</p>
            <p className="text-xs text-success-700 mt-0.5">
              This product has been verified through the EHB Seller Qualification process.
              {product.sq_badge_label && ` Level: ${product.sq_badge_label}`}
            </p>
          </div>

          <Button className="w-full" variant="outline" disabled>
            <MessageSquare className="h-4 w-4 mr-2" />Contact Seller (coming soon)
          </Button>
        </div>
      </div>

      {/* Description */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-3">Product Description</h2>
        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
      </div>

      {/* Image gallery */}
      {product.images.length > 1 && (
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-3">More Images</h2>
          <div className="flex gap-2 flex-wrap">
            {product.images.slice(1).map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={img} alt={`Product image ${i + 2}`} className="h-20 w-20 object-cover rounded-md border" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
