import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { SqLevel, SqStatus, AuditAction } from '@/types/pss.types';

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

// ── SQ Level colors ───────────────────────────────────────────────────────────

export function getSqLevelColor(level: SqLevel | number | null): string {
  if (level === null || level === undefined) return 'bg-gray-100 text-gray-700';
  if (level <= 3) return 'bg-gray-100 text-gray-700';
  if (level === 5) return 'bg-blue-100 text-blue-700';
  if (level === 7) return 'bg-purple-100 text-purple-700';
  if (level === 10) return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-700';
}

export function getSqLevelLabel(level: SqLevel | number | null): string {
  if (level === null || level === undefined) return 'Unscored';
  const labels: Record<number, string> = {
    1: 'SQ1 — Basic',
    2: 'SQ2 — Compliance',
    3: 'SQ3 — Financial',
    5: 'SQ5 — Verified',
    7: 'SQ7 — Experienced',
    10: 'SQ10 — Elite',
  };
  return labels[level] ?? `SQ${level}`;
}

// ── SQ Status colors ──────────────────────────────────────────────────────────

export function getSqStatusColor(status: SqStatus | string): string {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    pending_franchise: 'bg-orange-100 text-orange-700',
    pending_edr: 'bg-red-100 text-red-700',
    approved: 'bg-green-100 text-green-700',
    conditional: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return map[status] ?? 'bg-gray-100 text-gray-700';
}

export function getSqStatusLabel(status: SqStatus | string): string {
  const map: Record<string, string> = {
    pending: 'Pending',
    pending_franchise: 'Franchise Review',
    pending_edr: 'EDR Review',
    approved: 'Approved',
    conditional: 'Conditional',
    rejected: 'Rejected',
  };
  return map[status] ?? status;
}

// ── Audit action badge colors ─────────────────────────────────────────────────

export function getAuditActionColor(action: AuditAction | string): string {
  if (action === 'sq_submitted') return 'bg-gray-100 text-gray-700';
  if (action === 'sq_auto_approved') return 'bg-green-100 text-green-700';
  if (action === 'sq_rule_rejected') return 'bg-red-100 text-red-700';
  if (action.startsWith('sq_forwarded')) return 'bg-orange-100 text-orange-700';
  if (action === 'no_rule_matched') return 'bg-yellow-100 text-yellow-700';
  if (action === 'rule_engine_error') return 'bg-red-100 text-red-700';
  if (action.startsWith('franchise')) return 'bg-blue-100 text-blue-700';
  if (action.startsWith('edr')) return 'bg-purple-100 text-purple-700';
  if (action.startsWith('webhook')) return 'bg-teal-100 text-teal-700';
  return 'bg-gray-100 text-gray-700';
}

// ── Truncate string ───────────────────────────────────────────────────────────

export function truncate(str: string, maxLen = 40): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…';
}

// ── Object to key-value display pairs ────────────────────────────────────────

export function flattenObject(
  obj: Record<string, unknown>,
  prefix = '',
): Array<{ key: string; value: string }> {
  const result: Array<{ key: string; value: string }> = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      result.push(...flattenObject(v as Record<string, unknown>, key));
    } else if (Array.isArray(v)) {
      result.push({ key, value: v.join(', ') });
    } else {
      result.push({ key, value: String(v ?? '—') });
    }
  }
  return result;
}
