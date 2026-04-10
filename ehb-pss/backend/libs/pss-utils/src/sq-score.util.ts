import { SqLevel, SQ_LEVEL_LABELS } from '@ehb-pss/types';

/**
 * SQ Score Utilities
 *
 * Pure helpers for SQ score calculation — no business logic, no DB access.
 * Business logic lives in the sq-engine module service.
 */

/**
 * Maps a criteria-met percentage (0–100) to the highest achievable SQ level.
 *
 * Tier thresholds (designed to make each SQ level meaningful):
 *   < 20%   → null  (too few criteria met — not eligible)
 *   20–39%  → SQ1   Basic identity verified
 *   40–49%  → SQ2   Identity + basic compliance
 *   50–59%  → SQ3   Identity + financial validation
 *   60–79%  → SQ5   Professional credentials verified
 *   80–89%  → SQ7   Experienced + clean performance
 *   90–100% → SQ10  Elite certified entity
 *
 * These thresholds apply to the SQ LEVEL assignment only.
 * Routing (auto / franchise / EDR) is governed by platform_rules,
 * not by these thresholds — that is rule-engine's job.
 *
 * @param criteriaMetPercent - Number from 0 to 100
 * @returns SqLevel or null if below minimum eligibility
 */
export function calculateSqLevel(criteriaMetPercent: number): SqLevel | null {
  if (criteriaMetPercent < 20) return null;
  if (criteriaMetPercent < 40) return SqLevel.SQ1;
  if (criteriaMetPercent < 50) return SqLevel.SQ2;
  if (criteriaMetPercent < 60) return SqLevel.SQ3;
  if (criteriaMetPercent < 80) return SqLevel.SQ5;
  if (criteriaMetPercent < 90) return SqLevel.SQ7;
  return SqLevel.SQ10;
}

/**
 * Returns the human-readable badge label for a given SQ level.
 * e.g. SqLevel.SQ5 → 'SQ5 — Professional Credentials Verified'
 *
 * @param level - A valid SqLevel enum value
 */
export function getSqBadgeLabel(level: SqLevel): string {
  return SQ_LEVEL_LABELS[level] ?? `SQ${level}`;
}
