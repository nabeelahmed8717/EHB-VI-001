'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetAllPlatformsQuery } from '@/lib/store/api/platforms.api';
import { Skeleton } from '@/components/ui/skeleton';
import { ListChecks } from 'lucide-react';

export default function CriteriaIndexPage() {
  const router = useRouter();
  const { data: platforms, isLoading } = useGetAllPlatformsQuery();

  useEffect(() => {
    if (platforms && platforms.length > 0) {
      router.replace(`/criteria/${platforms[0].platform_id}`);
    }
  }, [platforms, router]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!platforms || platforms.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 py-20 text-center">
        <ListChecks className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">No platforms registered</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Register a platform first to define criteria sets
        </p>
      </div>
    );
  }

  return null;
}
