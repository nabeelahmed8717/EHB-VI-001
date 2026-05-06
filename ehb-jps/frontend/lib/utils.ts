import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { EhbPlatform, ProfileRole, ProfileStatus } from '@/types/jps.types';

// ── Tailwind merge utility ────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Date formatting ───────────────────────────────────────────────────────────

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ── SQ Level helpers ──────────────────────────────────────────────────────────

export function getSqLevelColor(level: number | null | undefined): string {
  if (level === null || level === undefined) return 'bg-gray-100 text-gray-600';
  if (level <= 3) return 'bg-gray-100 text-gray-700';
  if (level === 5) return 'bg-teal-100 text-teal-700';
  if (level === 7) return 'bg-purple-100 text-purple-700';
  if (level === 10) return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-700';
}

export function getSqLevelLabel(level: number | null | undefined): string {
  if (level === null || level === undefined) return 'Unscored';
  const labels: Record<number, string> = {
    1: 'SQ1',
    2: 'SQ2',
    3: 'SQ3',
    5: 'SQ5 — Verified',
    7: 'SQ7 — Experienced',
    10: 'SQ10 — Elite',
  };
  return labels[level] ?? `SQ${level}`;
}

// ── Profile status helpers ────────────────────────────────────────────────────

export function getStatusColor(status: ProfileStatus | string): string {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    submitted: 'bg-teal-100 text-teal-700',
    under_review: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    resubmit_required: 'bg-orange-100 text-orange-700',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

export function getStatusLabel(status: ProfileStatus | string): string {
  const map: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
    resubmit_required: 'Resubmit Required',
  };
  return map[status] ?? status;
}

// ── Role helpers ──────────────────────────────────────────────────────────────

export function getRoleLabel(role: ProfileRole | string): string {
  const map: Record<string, string> = {
    seller: 'Seller',
    buyer: 'Buyer',
    rider: 'Rider / Delivery',
    chef: 'Chef / Cook',
    driver: 'Driver',
    cleaner: 'Cleaner',
    electrician: 'Electrician',
    plumber: 'Plumber',
    trainer: 'Trainer / Instructor',
    worker: 'Worker',
    employer: 'Employer',
    freelancer: 'Freelancer',
    recruiter: 'Recruiter',
    doctor: 'Doctor',
    nurse: 'Nurse',
    lawyer: 'Lawyer',
    teacher: 'Teacher',
    other: 'Other',
  };
  return map[role] ?? role;
}

export function getRoleIcon(role: ProfileRole | string): string {
  const map: Record<string, string> = {
    seller: '🛍️',
    buyer: '🛒',
    rider: '🛵',
    chef: '👨‍🍳',
    driver: '🚗',
    cleaner: '🧹',
    electrician: '⚡',
    plumber: '🔧',
    trainer: '🎓',
    worker: '👷',
    employer: '🏢',
    freelancer: '💼',
    recruiter: '🔍',
    doctor: '🩺',
    nurse: '💉',
    lawyer: '⚖️',
    teacher: '📚',
    other: '👤',
  };
  return map[role] ?? '👤';
}

// ── Platform helpers ──────────────────────────────────────────────────────────

export function getPlatformLabel(platform: EhbPlatform | string): string {
  const map: Record<string, string> = {
    gosellr: 'GoSellr — Marketplace',
    jps: 'JPS — Job Providing Service',
    hps: 'HPS — Healthcare Platform',
    ols: 'OLS — Legal Marketplace',
    wms: 'WMS — Hospital Management',
    obs: 'OBS — Book Retail',
  };
  return map[platform] ?? platform;
}
