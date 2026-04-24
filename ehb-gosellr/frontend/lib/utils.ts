import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { SqStatus } from './store/api/products.api';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function getSqColor(level: number | null): string {
  if (level === null) return 'bg-gray-100 text-gray-600';
  if (level <= 3) return 'bg-gray-200 text-gray-800';
  if (level === 5) return 'bg-blue-100 text-blue-800';
  if (level === 7) return 'bg-purple-100 text-purple-800';
  if (level === 10) return 'bg-amber-100 text-amber-800';
  return 'bg-gray-100 text-gray-600';
}

export function getSqStatusConfig(status: SqStatus): { label: string; color: string } {
  const map: Record<SqStatus, { label: string; color: string }> = {
    not_submitted: { label: 'Not Submitted', color: 'bg-gray-100 text-gray-600' },
    pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
    pending_franchise: { label: 'Franchise Review', color: 'bg-orange-100 text-orange-800' },
    pending_edr: { label: 'EDR Review', color: 'bg-red-100 text-red-800' },
    approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  };
  return map[status] ?? { label: status, color: 'bg-gray-100 text-gray-600' };
}

export const PRODUCT_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Books',
  'Home & Garden',
  'Sports',
  'Other',
] as const;
