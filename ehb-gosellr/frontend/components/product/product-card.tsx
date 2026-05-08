import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { SqBadge } from '@/components/sq/sq-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';
import type { Product } from '@/lib/store/api/products.api';

interface ProductCardProps {
  product: Product;
  href?: string;
}

export function ProductCard({ product, href }: ProductCardProps) {
  const imgSrc = product.images?.[0] ?? null;
  return (
    <Link href={href ?? `/browse/${product._id}`} className="group block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden border-border">
        <div className="relative h-48 bg-surface-alt flex items-center justify-center overflow-hidden">
          {imgSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgSrc} alt={product.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <Package className="h-10 w-10 text-muted-foreground opacity-40" />
          )}
          {product.sq_status === 'approved' && (
            <div className="absolute top-2 right-2">
              <SqBadge level={product.sq_level} label={product.sq_badge_label} size="sm" />
            </div>
          )}
        </div>
        <CardContent className="p-3.5 space-y-1">
          <p className="font-medium text-sm line-clamp-2 text-foreground">{product.title}</p>
          <p className="text-xs text-muted-foreground">{product.category}</p>
          <p className="text-base font-bold text-foreground pt-1">{formatPrice(product.price)}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
