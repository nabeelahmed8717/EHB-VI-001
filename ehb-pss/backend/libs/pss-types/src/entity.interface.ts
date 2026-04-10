import { SqDecidedBy, SqLevel, SqStatus } from './sq-level.interface';

/**
 * Core entity identity — the minimum fields that identify any submittable
 * object across all EHB platforms.
 */
export interface IEntity {
  entity_id: string;
  entity_type: string;   // 'product' | 'seller_profile' | 'lawyer' | etc.
  user_id: string;
  platform_id: string;
}

/**
 * SQ Record — the trust ledger entry for a single entity.
 *
 * This is the source of truth for an entity's current SQ level.
 * Stored in pss_db.sq_records.
 *
 * Composite unique key: user_id + platform_id + entity_id
 */
export interface ISqRecord extends IEntity {
  sq_level: SqLevel | null;
  status: SqStatus;
  decided_by?: SqDecidedBy;
  approved_at?: Date;
  rejected_at?: Date;
  rejection_reason?: string | null;
  expires_at?: Date | null;
  can_resubmit?: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Badge display shape — returned to platform frontends for SQ badge rendering.
 */
export interface ISqBadge {
  entity_id: string;
  platform_id: string;
  sq_level: SqLevel | null;
  status: SqStatus;
  badge_label?: string;
}
