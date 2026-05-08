'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useGetProductsQuery, type ProductSort } from '@/lib/store/api/products.api';
import { ProductCard } from '@/components/product/product-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PRODUCT_CATEGORIES } from '@/lib/utils';
import { ShoppingBag, Search } from 'lucide-react';

function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCategory = searchParams.get('category') ?? undefined;
  const initialQuery    = searchParams.get('q') ?? '';
  const initialSort     = (searchParams.get('sort') as ProductSort | null) ?? undefined;
  const initialSeller   = searchParams.get('seller_id') ?? undefined;

  const [category, setCategory] = useState<string | undefined>(initialCategory);
  const [q, setQ] = useState<string>(initialQuery);
  const [searchInput, setSearchInput] = useState<string>(initialQuery);
  const [sort, setSort] = useState<ProductSort | undefined>(initialSort);
  const [page, setPage] = useState(1);

  // Sync state when the URL changes (e.g. user picks a category from the navbar).
  useEffect(() => {
    const cat = searchParams.get('category') ?? undefined;
    const search = searchParams.get('q') ?? '';
    const s = (searchParams.get('sort') as ProductSort | null) ?? undefined;
    setCategory(cat);
    setQ(search);
    setSearchInput(search);
    setSort(s);
    setPage(1);
  }, [searchParams]);

  const { data, isLoading } = useGetProductsQuery({
    category,
    q: q || undefined,
    sort,
    seller_id: initialSeller,
    page,
    limit: 20,
  });
  const products = data?.data ?? [];

  const updateUrl = (updates: Partial<{ category?: string; q?: string; sort?: ProductSort }>) => {
    const params = new URLSearchParams();
    const nextCategory = updates.category ?? category;
    const nextQuery    = (updates.q ?? q) ?? '';
    const nextSort     = updates.sort ?? sort;
    if (nextCategory) params.set('category', nextCategory);
    if (nextQuery && nextQuery.trim()) params.set('q', nextQuery.trim());
    if (nextSort) params.set('sort', nextSort);
    if (initialSeller) params.set('seller_id', initialSeller);
    const qs = params.toString();
    router.push(`/browse${qs ? `?${qs}` : ''}`);
  };

  const handleCategoryChange = (v: string) => {
    const cat = v === 'all' ? undefined : v;
    setCategory(cat);
    setPage(1);
    updateUrl({ category: cat });
  };

  const handleSortChange = (v: string) => {
    const s = v === 'default' ? undefined : (v as ProductSort);
    setSort(s);
    setPage(1);
    updateUrl({ sort: s });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(searchInput);
    setPage(1);
    updateUrl({ q: searchInput });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">Browse Products</h1>
          {data && (
            <span className="text-sm text-muted-foreground">
              ({data.total} SQ-verified product{data.total !== 1 ? 's' : ''})
            </span>
          )}
        </div>
      </div>

      {/* Filter bar — search + category + sort */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] flex items-center bg-surface-alt border border-border rounded-pill h-10 pl-3.5 pr-1 gap-2 focus-within:border-accent transition-colors">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setQ(''); updateUrl({ q: '' }); }}
              className="text-xs text-muted-foreground hover:text-foreground px-2"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            className="px-3 h-8 rounded-pill bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent-600 transition-colors"
          >
            Search
          </button>
        </form>

        <Select value={category ?? 'all'} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {PRODUCT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort ?? 'default'} onValueChange={handleSortChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="price_asc">Price: low to high</SelectItem>
            <SelectItem value="price_desc">Price: high to low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {q && (
        <p className="text-sm text-muted-foreground">
          Showing results for <span className="font-semibold text-foreground">&quot;{q}&quot;</span>
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-lg" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">{q ? `No products match "${q}"` : 'No approved products yet'}</p>
          <p className="text-sm">{q ? 'Try a different search term or remove filters.' : 'Check back soon as sellers get their products approved.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}

      {data && data.total_pages > 1 && (
        <div className="flex items-center gap-2 justify-center pt-4">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            Previous
          </Button>
          <span className="text-sm">{page} / {data.total_pages}</span>
          <Button variant="outline" disabled={page >= data.total_pages} onClick={() => setPage(p => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-72 rounded-lg" />)}
      </div>
    }>
      <BrowseContent />
    </Suspense>
  );
}
