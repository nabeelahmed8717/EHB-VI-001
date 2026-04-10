/**
 * SQ Level System — EHB Trust Scoring
 *
 * SQ (Standard Quality) levels are assigned per entity, not per user.
 * One user with 5 products has 5 separate SQ levels.
 * Key = user_id + platform_id + entity_id
 */

/** Valid SQ levels — only these 6 values exist in the system */
export enum SqLevel {
  SQ1 = 1,
  SQ2 = 2,
  SQ3 = 3,
  SQ5 = 5,
  SQ7 = 7,
  SQ10 = 10,
}

/** Human-readable label per SQ level */
export const SQ_LEVEL_LABELS: { [key in SqLevel]: string } = {
  [SqLevel.SQ1]: 'SQ1 — Basic Identity Verified',
  [SqLevel.SQ2]: 'SQ2 — Identity + Basic Platform Compliance',
  [SqLevel.SQ3]: 'SQ3 — Identity + Financial Validation',
  [SqLevel.SQ5]: 'SQ5 — Professional Credentials Verified',
  [SqLevel.SQ7]: 'SQ7 — Experienced + Clean Performance Record',
  [SqLevel.SQ10]: 'SQ10 — Elite Certified Entity',
};

/**
 * All possible statuses for an SQ record or request.
 * Platforms receive these values from GET /sq/status/:entity_id
 */
export type SqStatus =
  | 'pending'            // PSS is processing
  | 'pending_franchise'  // Waiting for franchise manual review
  | 'pending_edr'        // Waiting for EDR oversight review
  | 'approved'           // SQ level fully assigned
  | 'conditional'        // Intermediate SQ assigned — conditions apply
  | 'rejected';          // Rejected — reason logged in audit_logs

/** Who made the final SQ decision */
export type SqDecidedBy =
  | 'auto'       // PSS rule engine — no human involved
  | 'franchise'  // Franchise reviewer approved
  | 'edr';       // EDR overrode or approved
