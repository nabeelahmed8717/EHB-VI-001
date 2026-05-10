'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useCreateProductMutation } from '@/lib/store/api/products.api';
import { toast } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PRODUCT_CATEGORIES } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  price: z.coerce.number().min(1, 'Price must be at least 1'),
  category: z.string().min(1, 'Category is required'),
  images: z.array(z.string().url('Must be a valid URL')).max(5).default([]),
  stock: z.coerce.number().min(0).default(0),
});

type FormValues = z.infer<typeof schema>;

export default function NewProductPage() {
  const router = useRouter();
  const [createProduct, { isLoading }] = useCreateProductMutation();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { images: [], stock: 0, category: '' },
  });

  const images = watch('images') ?? [];

  const onSubmit = async (data: FormValues) => {
    try {
      const product = await createProduct({ ...data, images: images.filter(Boolean) }).unwrap();
      toast({ title: 'Product created!', description: 'Now you can submit it for SQ approval.' });
      router.push(`/dashboard/products/${product._id}`);
    } catch (err: unknown) {
      const e = err as {
        status?: number;
        data?: { error?: string; message?: string; next?: string };
      };
      // ── JPS profile guard ──
      // Backend returns 409 with { error: 'JPS_PROFILE_REQUIRED', next: '/dashboard/jps-profile' }
      // when the seller hasn't linked a JPS profile yet. Route them there.
      if (e?.data?.error === 'JPS_PROFILE_REQUIRED') {
        toast({
          title: 'JPS profile required',
          description:
            e.data.message ??
            'Link a JPS profile before uploading products.',
          variant: 'destructive',
        });
        router.push(e.data.next ?? '/dashboard/jps-profile');
        return;
      }
      toast({
        title: 'Error',
        description: e?.data?.message ?? 'Failed to create product',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        </Link>
        <h1 className="text-2xl font-bold">Add New Product</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Product Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input placeholder="Product title" {...register('title')} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Description *</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                placeholder="Detailed product description (min 20 characters)"
                {...register('description')}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Price (PKR) *</Label>
                <Input type="number" min="0" placeholder="85000" {...register('price')} />
                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Stock</Label>
                <Input type="number" min="0" placeholder="0" {...register('stock')} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Category *</Label>
              <Select onValueChange={(v) => setValue('category', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Product Images (up to 5 URLs)</Label>
              {[0, 1, 2, 3, 4].map((i) => (
                <Input
                  key={i}
                  placeholder={`Image URL ${i + 1}`}
                  value={images[i] ?? ''}
                  onChange={(e) => {
                    const updated = [...images];
                    updated[i] = e.target.value;
                    setValue('images', updated);
                  }}
                />
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Product'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
