import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SqLevel } from '@ehb-pss/types';
import {
  SqScoredEvent,
  AuditWriteEvent,
  SQ_ENGINE_EVENTS,
} from '../sq-engine/sq-engine.service';
import { SqEngineService } from '../sq-engine/sq-engine.service';
import {
  PlatformRule,
  PlatformRuleDocument,
  RuleAction,
  RuleOperator,
} from './platform-rule.schema';

// ── Internal Event Contracts ────────────────────────────────────────────────

export const RULE_ENGINE_EVENTS = {
  /** Final decision (auto_approve or reject) — webhook module listens to push to platform */
  DECISION: 'sq.decision',
  /** Routed to franchise for manual review */
  FRANCHISE_REVIEW: 'franchise.review_requested',
  /** Routed to EDR for oversight review */
  EDR_REVIEW: 'edr.review_requested',
} as const;

/**
 * Emitted when rule-engine makes a final decision (auto_approve or reject).
 * webhook module subscribes → sends PssWebhookDecisionDto to platform webhook URL.
 */
export interface SqDecisionEvent {
  sq_request_id: string;
  entity_id: string;
  entity_type: string;
  user_id: string;
  platform_id: string;
  decision: 'approved' | 'rejected';
  sq_level: number | null;
  decided_by: 'auto' | 'franchise' | 'edr';
  decided_at: Date;
  rejection_reason: string | null;
}

/**
 * Emitted when entity is forwarded to franchise for manual review.
 * franchise module subscribes → creates a franchise review record.
 */
export interface FranchiseReviewRequestedEvent {
  sq_request_id: string;
  entity_id: string;
  entity_type: string;
  user_id: string;
  platform_id: string;
  sq_level_calculated: SqLevel | null;
  criteria_met: number;
  total_criteria: number;
}

/**
 * Emitted when entity is forwarded to EDR for oversight review.
 * edr module subscribes → creates an EDR review record.
 */
export interface EdrReviewRequestedEvent {
  sq_request_id: string;
  entity_id: string;
  entity_type: string;
  user_id: string;
  platform_id: string;
  sq_level_calculated: SqLevel | null;
  criteria_met: number;
  total_criteria: number;
}

// ── Routing Result ──────────────────────────────────────────────────────────

interface RoutingResult {
  matched: true;
  rule: PlatformRuleDocument;
  action: RuleAction;
}
interface NoRuleMatched {
  matched: false;
}
type EvaluationResult = RoutingResult | NoRuleMatched;

// ── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class RuleEngineService {
  private readonly logger = new Logger(RuleEngineService.name);

  constructor(
    @InjectModel(PlatformRule.name)
    private readonly platformRuleModel: Model<PlatformRuleDocument>,

    private readonly sqEngineService: SqEngineService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ── Event Listener ─────────────────────────────────────────────────────

  /**
   * Listens for 'sq.scored' from sq-engine.
   * This is the entry point of all routing logic.
   *
   * Flow:
   *   1. Load active rules for platform, sorted by priority ASC
   *   2. Evaluate each rule against criteria_met — first match wins
   *   3. Execute routing action (auto_approve | franchise | edr | reject)
   *   4. Emit audit.write before every action
   *   5. Emit action-specific downstream event
   *   6. If no rule matches: log + emit audit with 'no_rule_matched'
   */
  @OnEvent('sq.scored', { async: true })
  async handleSqScored(event: SqScoredEvent): Promise<void> {
    const {
      sq_request_id,
      entity_id,
      entity_type,
      user_id,
      platform_id,
      sq_level_calculated,
      criteria_met,
      total_criteria,
    } = event;

    this.logger.log(
      `Rule evaluation: sq_request=${sq_request_id} platform=${platform_id} ` +
      `criteria_met=${criteria_met}/${total_criteria}`,
    );

    try {
      // ── 1. Load active rules for this platform, priority ASC ──────────
      const rules = await this.platformRuleModel
        .find({ platform_id, active: true })
        .sort({ priority: 1, created_at: 1 })
        .exec();

      if (rules.length === 0) {
        this.logger.warn(
          `No active rules found for platform=${platform_id}. ` +
          `sq_request=${sq_request_id} stays pending.`,
        );
        this.emitAuditWrite({
          sq_request_id,
          entity_id,
          entity_type,
          user_id,
          platform_id,
          action: 'no_rule_matched',
          reason: `No active routing rules configured for platform ${platform_id}. Request stays pending.`,
          performed_by: 'system',
        });
        return;
      }

      // ── 2. Evaluate rules in priority order — first match wins ────────
      const result = this.evaluateRules(rules, criteria_met);

      if (!result.matched) {
        this.logger.warn(
          `No rule matched for sq_request=${sq_request_id} ` +
          `platform=${platform_id} criteria_met=${criteria_met}. Stays pending.`,
        );
        this.emitAuditWrite({
          sq_request_id,
          entity_id,
          entity_type,
          user_id,
          platform_id,
          action: 'no_rule_matched',
          reason:
            `No rule matched criteria_met=${criteria_met} against ` +
            `${rules.length} active rule(s) for platform ${platform_id}. ` +
            `Request remains pending.`,
          performed_by: 'system',
        });
        return;
      }

      // ── 3. Execute the matched rule's action ──────────────────────────
      const { rule } = result;
      this.logger.log(
        `Rule matched: "${rule.rule_name}" (priority=${rule.priority}) → action=${rule.action}`,
      );

      await this.executeAction(rule, event);

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Rule engine error for sq_request=${sq_request_id}: ${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      // Emit audit so failure is traceable — request stays pending for retry/admin review
      this.emitAuditWrite({
        sq_request_id,
        entity_id,
        entity_type,
        user_id,
        platform_id,
        action: 'rule_engine_error',
        reason: `Rule engine threw an error: ${message}. Request stays pending for manual review.`,
        performed_by: 'system',
      });
    }
  }

  // ── Rule Evaluation ────────────────────────────────────────────────────

  /**
   * Evaluates an ordered list of rules against criteria_met.
   * Returns the first matching rule or { matched: false }.
   */
  private evaluateRules(
    rules: PlatformRuleDocument[],
    criteria_met: number,
  ): EvaluationResult {
    for (const rule of rules) {
      if (this.ruleMatches(rule, criteria_met)) {
        return { matched: true, rule, action: rule.action };
      }
    }
    return { matched: false };
  }

  /**
   * Tests whether a single rule's threshold condition is satisfied.
   *
   *   gte     → criteria_met >= criteria_threshold
   *   lte     → criteria_met <= criteria_threshold
   *   eq      → criteria_met === criteria_threshold
   *   between → criteria_threshold <= criteria_met <= threshold_max
   */
  private ruleMatches(
    rule: PlatformRuleDocument,
    criteria_met: number,
  ): boolean {
    const { criteria_threshold, operator, threshold_max } = rule;

    switch (operator as RuleOperator) {
      case 'gte':
        return criteria_met >= criteria_threshold;
      case 'lte':
        return criteria_met <= criteria_threshold;
      case 'eq':
        return criteria_met === criteria_threshold;
      case 'between': {
        if (threshold_max === null || threshold_max === undefined) {
          this.logger.warn(
            `Rule "${rule.rule_name}" uses operator=between but has no threshold_max. Skipping.`,
          );
          return false;
        }
        return (
          criteria_met >= criteria_threshold &&
          criteria_met <= threshold_max
        );
      }
      default:
        this.logger.warn(`Unknown operator "${operator}" on rule "${rule.rule_name}". Skipping.`);
        return false;
    }
  }

  // ── Action Execution ───────────────────────────────────────────────────

  /**
   * Executes the routing action defined by a matched rule.
   * Audit is written BEFORE the downstream event is emitted.
   */
  private async executeAction(
    rule: PlatformRuleDocument,
    event: SqScoredEvent,
  ): Promise<void> {
    const {
      sq_request_id,
      entity_id,
      entity_type,
      user_id,
      platform_id,
      sq_level_calculated,
      criteria_met,
      total_criteria,
    } = event;

    switch (rule.action as RuleAction) {

      // ── auto_approve ─────────────────────────────────────────────────
      case 'auto_approve': {
        // Use rule's explicit sq_level_assigned if set, otherwise fall back
        // to the score-calculated level from sq-engine
        const sq_level_to_assign: number =
          rule.sq_level_assigned && rule.sq_level_assigned > 0
            ? rule.sq_level_assigned
            : (sq_level_calculated ?? 1);

        const decidedAt = new Date();

        // Audit FIRST — before any state mutation
        this.emitAuditWrite({
          sq_request_id,
          entity_id,
          entity_type,
          user_id,
          platform_id,
          action: 'sq_auto_approved',
          reason:
            `Rule "${rule.rule_name}" (priority=${rule.priority}) matched: ` +
            `criteria_met=${criteria_met}. Auto-approved with SQ${sq_level_to_assign}.`,
          performed_by: 'system',
          sq_level_before: null,
          sq_level_after: sq_level_to_assign as SqLevel,
          decided_by: 'auto',
        });

        // Write decision to sq_requests + sq_records via SqEngineService
        await this.sqEngineService.finalizeApproval(
          sq_request_id,
          sq_level_to_assign,
          'auto',
        );

        // Emit final decision for webhook module
        const decisionPayload: SqDecisionEvent = {
          sq_request_id,
          entity_id,
          entity_type,
          user_id,
          platform_id,
          decision: 'approved',
          sq_level: sq_level_to_assign,
          decided_by: 'auto',
          decided_at: decidedAt,
          rejection_reason: null,
        };
        this.eventEmitter.emit(RULE_ENGINE_EVENTS.DECISION, decisionPayload);
        this.logger.log(
          `Emitted '${RULE_ENGINE_EVENTS.DECISION}' approved: ` +
          `sq_request=${sq_request_id} SQ${sq_level_to_assign}`,
        );
        break;
      }

      // ── franchise ────────────────────────────────────────────────────
      case 'franchise': {
        // Audit FIRST
        this.emitAuditWrite({
          sq_request_id,
          entity_id,
          entity_type,
          user_id,
          platform_id,
          action: 'sq_forwarded_franchise',
          reason:
            `Rule "${rule.rule_name}" (priority=${rule.priority}) matched: ` +
            `criteria_met=${criteria_met}. Forwarded to franchise for manual review.`,
          performed_by: 'system',
          sq_level_before: null,
          sq_level_after: null,
        });

        // Update SqRequest status → pending_franchise
        await this.sqEngineService.forwardToReview(
          sq_request_id,
          'pending_franchise',
        );

        // Emit franchise review request
        const franchisePayload: FranchiseReviewRequestedEvent = {
          sq_request_id,
          entity_id,
          entity_type,
          user_id,
          platform_id,
          sq_level_calculated,
          criteria_met,
          total_criteria,
        };
        this.eventEmitter.emit(RULE_ENGINE_EVENTS.FRANCHISE_REVIEW, franchisePayload);
        this.logger.log(
          `Emitted '${RULE_ENGINE_EVENTS.FRANCHISE_REVIEW}': sq_request=${sq_request_id}`,
        );
        break;
      }

      // ── edr ──────────────────────────────────────────────────────────
      case 'edr': {
        // Audit FIRST
        this.emitAuditWrite({
          sq_request_id,
          entity_id,
          entity_type,
          user_id,
          platform_id,
          action: 'sq_forwarded_edr',
          reason:
            `Rule "${rule.rule_name}" (priority=${rule.priority}) matched: ` +
            `criteria_met=${criteria_met}. Forwarded to EDR for oversight review.`,
          performed_by: 'system',
          sq_level_before: null,
          sq_level_after: null,
        });

        // Update SqRequest status → pending_edr
        await this.sqEngineService.forwardToReview(
          sq_request_id,
          'pending_edr',
        );

        // Emit EDR review request
        const edrPayload: EdrReviewRequestedEvent = {
          sq_request_id,
          entity_id,
          entity_type,
          user_id,
          platform_id,
          sq_level_calculated,
          criteria_met,
          total_criteria,
        };
        this.eventEmitter.emit(RULE_ENGINE_EVENTS.EDR_REVIEW, edrPayload);
        this.logger.log(
          `Emitted '${RULE_ENGINE_EVENTS.EDR_REVIEW}': sq_request=${sq_request_id}`,
        );
        break;
      }

      // ── reject ───────────────────────────────────────────────────────
      case 'reject': {
        // rejection_reason is always required on a reject action
        const rejection_reason =
          rule.rejection_reason?.trim() ||
          `Rejected by rule "${rule.rule_name}": insufficient criteria met (${criteria_met}/${total_criteria}).`;

        const decidedAt = new Date();

        // Audit FIRST — before mutation
        this.emitAuditWrite({
          sq_request_id,
          entity_id,
          entity_type,
          user_id,
          platform_id,
          action: 'sq_rule_rejected',
          reason:
            `Rule "${rule.rule_name}" (priority=${rule.priority}) matched: ` +
            `criteria_met=${criteria_met}. Rejected: ${rejection_reason}`,
          performed_by: 'system',
          sq_level_before: null,
          sq_level_after: null,
          decided_by: 'auto',
        });

        // Write rejection to sq_requests + sq_records
        await this.sqEngineService.finalizeRejection(
          sq_request_id,
          rejection_reason,
          'auto',
        );

        // Emit final decision for webhook module
        const rejectionPayload: SqDecisionEvent = {
          sq_request_id,
          entity_id,
          entity_type,
          user_id,
          platform_id,
          decision: 'rejected',
          sq_level: null,
          decided_by: 'auto',
          decided_at: decidedAt,
          rejection_reason,
        };
        this.eventEmitter.emit(RULE_ENGINE_EVENTS.DECISION, rejectionPayload);
        this.logger.log(
          `Emitted '${RULE_ENGINE_EVENTS.DECISION}' rejected: sq_request=${sq_request_id}`,
        );
        break;
      }

      default:
        this.logger.error(
          `Unknown action "${rule.action}" on rule "${rule.rule_name}". Doing nothing.`,
        );
    }
  }

  // ── Admin CRUD Operations ──────────────────────────────────────────────

  /** List all rules for a platform, sorted by priority */
  async getRulesForPlatform(platform_id: string): Promise<PlatformRuleDocument[]> {
    return this.platformRuleModel
      .find({ platform_id })
      .sort({ priority: 1, created_at: 1 })
      .exec();
  }

  /** Create a new rule */
  async createRule(
    data: Partial<PlatformRule>,
  ): Promise<PlatformRuleDocument> {
    const rule = new this.platformRuleModel(data);
    return rule.save();
  }

  /** Update an existing rule by its _id */
  async updateRule(
    rule_id: string,
    data: Partial<PlatformRule>,
  ): Promise<PlatformRuleDocument | null> {
    return this.platformRuleModel.findByIdAndUpdate(rule_id, data, { new: true }).exec();
  }

  /** Delete a rule by its _id */
  async deleteRule(rule_id: string): Promise<boolean> {
    const result = await this.platformRuleModel.findByIdAndDelete(rule_id).exec();
    return result !== null;
  }

  /**
   * Toggle a rule's active state.
   * Inactive rules are skipped during evaluation.
   */
  async toggleRule(rule_id: string): Promise<PlatformRuleDocument | null> {
    const rule = await this.platformRuleModel.findById(rule_id).exec();
    if (!rule) return null;
    rule.active = !rule.active;
    return rule.save();
  }

  // ── Private Helpers ────────────────────────────────────────────────────

  private emitAuditWrite(payload: AuditWriteEvent): void {
    this.eventEmitter.emit(SQ_ENGINE_EVENTS.AUDIT_WRITE, payload);
  }
}
