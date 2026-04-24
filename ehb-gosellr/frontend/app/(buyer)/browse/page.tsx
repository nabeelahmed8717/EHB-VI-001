'use client';

import { useState } from 'react';
import { useGetProductsQuery } from '@/lib/store/api/products.api';
import { ProductCard } from '@/components/product/product-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PRODUCT_CATEGORIES } from '@/lib/utils';
import { ShoppingBag } from 'lucide-react';

export default function BrowsePage() {
  const [category, setCategory] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetProductsQuery({ category, page, limit: 20 });

  const products = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Browse Products</h1>
          {data && <span className="text-sm text-muted-foreground">({data.total} SQ-verified products)</span>}
        </div>

        {/* Category filter */}
        <Select value={category ?? 'all'} onValueChange={(v) => { setCategory(v === 'all' ? undefined : v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {PRODUCT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-72 w-full rounded-lg" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No approved products yet</p>
          <p className="text-sm">Check back soon as sellers get their products approved.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center gap-2 justify-center pt-4">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm">{page} / {data.total_pages}</span>
          <Button variant="outline" disabled={page >= data.total_pages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
