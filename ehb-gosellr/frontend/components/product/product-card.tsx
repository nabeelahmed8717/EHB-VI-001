import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { SqBadge } from '@/components/sq/sq-badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Product } from '@/lib/store/api/products.api';

interface ProductCardProps {
  product: Product;
  href?: string;
}

export function ProductCard({ product, href }: ProductCardProps) {
  const imgSrc = product.images?.[0] ?? null;

  return (
    <Link href={href ?? `/browse/${product._id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
        <div className="relative h-48 bg-gray-100 flex items-center justify-center">
          {imgSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgSrc} alt={product.title} className="h-full w-full object-cover" />
          ) : (
            <span className="text-gray-400 text-sm">No image</span>
          )}
          {product.sq_status === 'approved' && (
            <div className="absolute top-2 right-2">
              <SqBadge level={product.sq_level} label={product.sq_badge_label} size="sm" />
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-1">
          <p className="font-semibold text-sm line-clamp-2">{product.title}</p>
          <p className="text-xs text-muted-foreground">{product.category}</p>
          <p className="text-base font-bold text-primary">{formatPrice(product.price)}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
