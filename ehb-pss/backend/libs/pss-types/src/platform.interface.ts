/**
 * Platform definitions — all EHB sub-companies registered with PSS.
 */

/** All known EHB platform IDs */
export type PlatformId =
  | 'gosellr'  // E-commerce
  | 'ols'      // Legal professional marketplace
  | 'hps'      // Healthcare professional listings
  | 'jps'      // Workforce & employment
  | 'wms'      // Hospital & clinic management
  | 'obs'      // Book retail
  | 'edr';     // Internal review department (special platform)

/**
 * Platform registration record — stored in pss_db.platforms.
 * Created via POST /platforms/register (admin only).
 */
export interface IPlatform {
  platform_id: PlatformId | string;
  platform_name: string;
  webhook_url: string;                // PSS sends SQ decisions here
  entity_types: string[];             // e.g. ['product', 'seller_profile']
  contact_email: string;
  is_active: boolean;
  registered_at: Date;
}

/**
 * Platform routing rule — admin-configured per platform.
 * Determines how SQ scores are routed: auto / franchise / EDR.
 * Each platform configures its own rules — no global rules shared.
 * Stored in pss_db.platform_rules.
 */
export interface IPlatformRule {
  platform_id: string;
  entity_type: string;
  /**
   * Percentage of criteria met that triggers auto-approval.
   * e.g. 80 → if entity meets 80%+ criteria, auto-approve.
   */
  auto_approve_threshold: number;
  /**
   * Percentage of criteria met that routes to franchise review.
   * e.g. 50 → if entity meets 50–79% criteria, send to franchise.
   * Anything below this threshold escalates to EDR.
   */
  franchise_threshold: number;
  created_by: string;
  updated_at: Date;
}

/**
 * Criteria definition — one item in a platform's criteria set.
 * Stored in pss_db.criteria_sets.
 */
export interface ICriterion {
  id: string;
  platform_id: string;
  entity_type: string;
  label: string;
  required: boolean;
  sq_min: number;    // Minimum SQ level this criterion contributes to
}

/**
 * Full criteria set for a platform + entity type combination.
 */
export interface ICriteriaSet {
  platform_id: string;
  entity_type: string;
  criteria: ICriterion[];
}
