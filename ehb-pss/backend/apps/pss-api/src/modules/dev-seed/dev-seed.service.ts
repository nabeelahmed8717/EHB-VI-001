import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PlatformsService } from '../platforms/platforms.service';
import { CriteriaService } from '../criteria/criteria.service';
import { RuleEngineService } from '../rule-engine/rule-engine.service';
import type { Criterion } from '../criteria/criteria-set.schema';
import type { PlatformRule } from '../rule-engine/platform-rule.schema';

/**
 * DevSeedService
 *
 * Ensures all dev sub-platforms are registered in PSS with known fixed API
 * keys, criteria sets, and routing rules so local dev works without manual setup.
 *
 * Runs once on every PSS startup via OnModuleInit (idempotent — safe to restart).
 *
 * To add another platform: append to DEV_PLATFORMS, DEV_CRITERIA, DEV_RULES.
 */
@Injectable()
export class DevSeedService implements OnModuleInit {
  private readonly logger = new Logger(DevSeedService.name);

  // ── Platform registrations ────────────────────────────────────────────────

  private readonly DEV_PLATFORMS = [
    {
      platform_id: 'gosellr',
      platform_name: 'GoSellr',
      api_key: 'pk_gosellr_dev_key',
      webhook_url: 'http://localhost:3002/api/webhooks/pss',
      webhook_secret: 'whsec_gosellr_dev',
      entity_types: ['product', 'seller_profile'],
      contact_email: 'dev@gosellr.local',
    },
    {
      platform_id: 'jps',
      platform_name: 'JPS — Job Providing Service',
      api_key: 'pk_jps_dev_key',
      webhook_url: 'http://localhost:3006/webhooks/pss',   // JPS has no /api global prefix
      webhook_secret: 'whsec_jps_dev',
      entity_types: ['jps_profile'],
      contact_email: 'dev@jps.local',
    },
  ];

  // ── Criteria sets ─────────────────────────────────────────────────────────
  //
  // Each entry seeds a CriteriaSet for (platform_id, entity_type).
  // criteria[] maps to fields in entity_data sent by the platform on submit.
  // sq-engine evaluates all criteria and computes sq_score (0–100 %).

  private readonly DEV_CRITERIA: Array<{
    platform_id: string;
    entity_type: string;
    criteria: Criterion[];
  }> = [
    {
      platform_id: 'jps',
      entity_type: 'jps_profile',
      criteria: [
        // ── Core profile fields (required blockers) ────────────────────────
        {
          id: 'c1',
          label: 'Display Name',
          field_key: 'display_name',
          required: true,
          sq_min: 1,
          check_type: 'presence',
          check_value: null,
        },
        {
          id: 'c2',
          label: 'Platform',
          field_key: 'platform',
          required: true,
          sq_min: 1,
          check_type: 'presence',
          check_value: null,
        },
        {
          id: 'c3',
          label: 'Profile Role',
          field_key: 'role',
          required: true,
          sq_min: 1,
          check_type: 'presence',
          check_value: null,
        },
        // ── Bio & description (quality signals) ────────────────────────────
        {
          id: 'c4',
          label: 'Bio',
          field_key: 'bio',
          required: false,
          sq_min: 1,
          check_type: 'min_length',
          check_value: 10,
        },
        {
          id: 'c5',
          label: 'Profile Description',
          field_key: 'description',
          required: false,
          sq_min: 1,
          check_type: 'min_length',
          check_value: 30,
        },
        // ── Identity documents (CNIC — mandatory for SQ verification) ──────
        // Required = true means failing either CNIC criterion hard-blocks SQ
        // regardless of overall score, and the request is routed to EDR for
        // manual identity document verification.
        {
          id: 'c6',
          label: 'CNIC Front',
          field_key: 'cnic_front',
          required: true,
          sq_min: 1,
          check_type: 'presence',
          check_value: null,
        },
        {
          id: 'c7',
          label: 'CNIC Back',
          field_key: 'cnic_back',
          required: true,
          sq_min: 1,
          check_type: 'presence',
          check_value: null,
        },
        // ── Address & address proof ────────────────────────────────────────
        {
          id: 'c8',
          label: 'Address',
          field_key: 'address',
          required: false,
          sq_min: 1,
          check_type: 'min_length',
          check_value: 10,
        },
        {
          id: 'c9',
          label: 'Address Proof Document',
          field_key: 'address_proof',
          required: false,
          sq_min: 1,
          check_type: 'presence',
          check_value: null,
        },
      ],
    },
  ];

  // ── Routing rules ─────────────────────────────────────────────────────────
  //
  // Rules operate on sq_score (0–100 %). First matching rule (by priority ASC) wins.
  //
  // JPS rule design rationale:
  //   ≥ 67 %  (6+ / 9 criteria)  → EDR
  //     Profile is sufficiently complete and CNIC docs are likely present.
  //     EDR performs manual identity document verification before any SQ level is
  //     assigned.  No auto-approval for JPS — identity always needs a human check.
  //
  //   ≥ 34 %  (3–5 / 9 criteria) → Franchise
  //     Profile is partially complete. A franchise agent reviews and may request
  //     corrections before resubmission.
  //
  //   ≥ 0 %   (< 3 / 9 criteria) → Reject
  //     Insufficient profile information. Rejected immediately with guidance.

  private readonly DEV_RULES: Array<Partial<PlatformRule>> = [
    // ── [DEV] Rule 0: Perfect / near-perfect profile → Auto-approve ───────
    // sq_score >= 89 % means at least 8 of 9 criteria are met.
    // All required fields (display_name, platform, role, CNIC front, CNIC back)
    // plus most optional fields (bio, description, address, address_proof) are present.
    // This rule exists purely to enable end-to-end testing in dev without needing
    // a PSS admin to manually approve every submission.
    // In production, remove or deactivate this rule and rely on EDR/Franchise review.
    {
      platform_id: 'jps',
      rule_name: 'JPS — [DEV] Perfect profile → Auto-approve SQ5',
      criteria_threshold: 89,       // sq_score >= 89 % (8+ / 9 criteria met)
      operator: 'gte',
      threshold_max: null,
      action: 'auto_approve',
      sq_level_assigned: 5,         // Grant SQ5 — Verified Professional
      rejection_reason: null,
      priority: 5,                  // Evaluated first — beats the EDR rule at priority 10
      active: true,
    },
    // ── JPS Rule 1: Complete / near-complete profile → EDR ────────────────
    {
      platform_id: 'jps',
      rule_name: 'JPS — Complete profile → EDR identity verification',
      criteria_threshold: 67,       // sq_score >= 67 %
      operator: 'gte',
      threshold_max: null,
      action: 'edr',
      sq_level_assigned: null,
      rejection_reason: null,
      priority: 10,
      active: true,
    },
    // ── JPS Rule 2: Partial profile → Franchise review ─────────────────────
    {
      platform_id: 'jps',
      rule_name: 'JPS — Partial profile → Franchise manual review',
      criteria_threshold: 34,       // sq_score >= 34 % (and < 67, Rule 1 already exhausted)
      operator: 'gte',
      threshold_max: null,
      action: 'franchise',
      sq_level_assigned: null,
      rejection_reason: null,
      priority: 20,
      active: true,
    },
    // ── JPS Rule 3: Insufficient profile → Reject ──────────────────────────
    {
      platform_id: 'jps',
      rule_name: 'JPS — Insufficient profile → Reject',
      criteria_threshold: 0,        // catch-all: sq_score >= 0 (always matches)
      operator: 'gte',
      threshold_max: null,
      action: 'reject',
      sq_level_assigned: null,
      rejection_reason:
        'Your profile does not meet the minimum requirements for SQ verification. ' +
        'Please complete your display name, role, CNIC documents (front & back), ' +
        'and a detailed profile description before resubmitting.',
      priority: 30,
      active: true,
    },
  ];

  constructor(
    private readonly platformsService: PlatformsService,
    private readonly criteriaService: CriteriaService,
    private readonly ruleEngineService: RuleEngineService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Running dev seed…');
    await this.seedPlatforms();
    await this.seedCriteria();
    await this.seedRules();
    this.logger.log('Dev seed complete');
  }

  // ── Platform seeding ──────────────────────────────────────────────────────

  private async seedPlatforms(): Promise<void> {
    for (const p of this.DEV_PLATFORMS) {
      try {
        const existing = await this.platformsService.getPlatform(p.platform_id);
        if (existing) {
          await this.platformsService.forceSetDevKey(
            p.platform_id,
            p.api_key,
            p.webhook_url,
            p.webhook_secret,
          );
          this.logger.log(`Platform seed: synced ${p.platform_id} (status=active)`);
        } else {
          await this.platformsService.registerDevPlatform(p);
          this.logger.log(`Platform seed: registered ${p.platform_id}`);
        }
      } catch (err: unknown) {
        this.logger.warn(`Platform seed failed for ${p.platform_id}: ${String(err)}`);
      }
    }
  }

  // ── Criteria seeding ──────────────────────────────────────────────────────

  private async seedCriteria(): Promise<void> {
    for (const c of this.DEV_CRITERIA) {
      try {
        const existing = await this.criteriaService.getCriteriaSet(
          c.platform_id,
          c.entity_type,
        );
        if (existing) {
          // Always overwrite criteria so code changes propagate on restart
          await this.criteriaService.updateCriteriaSet(
            (existing._id as unknown as { toString(): string }).toString(),
            { criteria: c.criteria, active: true },
          );
          this.logger.log(
            `Criteria seed: updated ${c.platform_id}/${c.entity_type} ` +
            `(${c.criteria.length} criteria)`,
          );
        } else {
          await this.criteriaService.createCriteriaSet(
            c.platform_id,
            c.entity_type,
            c.criteria,
          );
          this.logger.log(
            `Criteria seed: created ${c.platform_id}/${c.entity_type} ` +
            `(${c.criteria.length} criteria)`,
          );
        }
      } catch (err: unknown) {
        this.logger.warn(
          `Criteria seed failed for ${c.platform_id}/${c.entity_type}: ${String(err)}`,
        );
      }
    }
  }

  // ── Rules seeding ─────────────────────────────────────────────────────────

  private async seedRules(): Promise<void> {
    for (const r of this.DEV_RULES) {
      if (!r.platform_id || !r.rule_name) continue;
      try {
        // Check if a rule with this exact name already exists for the platform
        const existing = await this.ruleEngineService.getRulesForPlatform(r.platform_id);
        const match = existing.find((x) => x.rule_name === r.rule_name);

        if (match) {
          await this.ruleEngineService.updateRule(
            (match._id as unknown as { toString(): string }).toString(),
            r,
          );
          this.logger.log(`Rules seed: updated "${r.rule_name}"`);
        } else {
          await this.ruleEngineService.createRule(r);
          this.logger.log(`Rules seed: created "${r.rule_name}"`);
        }
      } catch (err: unknown) {
        this.logger.warn(`Rules seed failed for "${r.rule_name}": ${String(err)}`);
      }
    }
  }
}
