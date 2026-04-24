import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CriteriaSet, CriteriaSetDocument, Criterion, CriterionCheckType } from './criteria-set.schema';

// ── Evaluation result type ────────────────────────────────────────────────────

export interface CriterionResult {
  id: string;
  label: string;
  field_key: string;
  satisfied: boolean;
  check_type: CriterionCheckType;
  value_found: unknown;
}

export interface EvaluationResult {
  criteria_met: number;
  total_criteria: number;
  sq_score: number;
  detail: CriterionResult[];
}

/**
 * Criteria Service
 *
 * Manages per-platform criteria sets and exposes the evaluation engine
 * used by SqEngineService to score entity submissions.
 *
 * Key exported methods:
 *   getCriteriaSet(platform_id, entity_type)       ← loaded by SqEngineService at submit time
 *   evaluateCriteria(criteria_set, entity_data)     ← used by SqEngineService for scoring
 *
 * Architecture:
 *   - No events emitted — criteria is a pure data management module
 *   - Soft-delete via active=false — never hard-deletes criteria sets
 *   - Evaluation is stateless and synchronous (pure function behaviour)
 */
@Injectable()
export class CriteriaService {
  private readonly logger = new Logger(CriteriaService.name);

  constructor(
    @InjectModel(CriteriaSet.name)
    private readonly criteriaSetModel: Model<CriteriaSetDocument>,
  ) {}

  // ── Query: getCriteriaSet ─────────────────────────────────────────────────

  /**
   * Loads the active criteria set for a given platform + entity type.
   * Called by SqEngineService at submission time.
   * Returns null if no active criteria set exists (entity scores 0 criteria).
   */
  async getCriteriaSet(
    platform_id: string,
    entity_type: string,
  ): Promise<CriteriaSetDocument | null> {
    return this.criteriaSetModel
      .findOne({ platform_id, entity_type, active: true })
      .exec();
  }

  /**
   * Returns all criteria sets for a platform (active + inactive).
   * Optional entity_type filter.
   */
  async getCriteriaSetsForPlatform(
    platform_id: string,
    entity_type?: string,
  ): Promise<CriteriaSetDocument[]> {
    const query: Record<string, unknown> = { platform_id, active: true };
    if (entity_type) query['entity_type'] = entity_type;
    return this.criteriaSetModel.find(query).sort({ entity_type: 1 }).exec();
  }

  // ── Mutation: create ──────────────────────────────────────────────────────

  /**
   * Creates a new criteria set for a platform + entity_type.
   * Throws ConflictException if one already exists (even if inactive).
   * Admin must PATCH to reactivate or update an existing set.
   */
  async createCriteriaSet(
    platform_id: string,
    entity_type: string,
    criteria: Criterion[],
  ): Promise<CriteriaSetDocument> {
    const existing = await this.criteriaSetModel
      .findOne({ platform_id, entity_type })
      .exec();

    if (existing) {
      throw new ConflictException(
        `Criteria set for platform="${platform_id}" entity_type="${entity_type}" already exists. ` +
        `Use PATCH /criteria/${existing._id} to update it.`,
      );
    }

    const created = await this.criteriaSetModel.create({
      platform_id,
      entity_type,
      criteria,
      active: true,
    });

    this.logger.log(
      `Created criteria set: platform=${platform_id} entity_type=${entity_type} ` +
      `criteria_count=${criteria.length}`,
    );

    return created;
  }

  // ── Mutation: update ──────────────────────────────────────────────────────

  /**
   * Partial update of a criteria set.
   * Supports updating criteria array, active flag, or entity_type label.
   */
  async updateCriteriaSet(
    criteria_set_id: string,
    patch: {
      criteria?: Criterion[];
      active?: boolean;
      entity_type?: string;
    },
  ): Promise<CriteriaSetDocument> {
    const updated = await this.criteriaSetModel
      .findByIdAndUpdate(criteria_set_id, patch, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(
        `CriteriaSet with id="${criteria_set_id}" not found`,
      );
    }

    this.logger.log(`Updated criteria set: id=${criteria_set_id}`);
    return updated;
  }

  // ── Mutation: soft-delete ─────────────────────────────────────────────────

  /**
   * Soft-deletes a criteria set by setting active=false.
   * sq-engine will ignore inactive sets (entity scores 0 criteria).
   * Hard delete is not supported — audit trail integrity.
   */
  async deleteCriteriaSet(criteria_set_id: string): Promise<CriteriaSetDocument> {
    const updated = await this.criteriaSetModel
      .findByIdAndUpdate(criteria_set_id, { active: false }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(
        `CriteriaSet with id="${criteria_set_id}" not found`,
      );
    }

    this.logger.log(`Soft-deleted criteria set: id=${criteria_set_id}`);
    return updated;
  }

  // ── Evaluation Engine ─────────────────────────────────────────────────────

  /**
   * Evaluates entity_data against a criteria set.
   * Returns criteria_met, total_criteria, sq_score (%), and per-criterion detail.
   *
   * Called by SqEngineService.submitForSQ() — replaces the inline
   * evaluateCriteria() private method that was there for the interim phase.
   *
   * Check types:
   *   presence   — value is non-null, non-empty (default; most lenient)
   *   min_length — string/array length >= check_value (number)
   *   min_value  — numeric value >= check_value (number)
   *   regex      — string matches check_value (string pattern)
   */
  evaluateCriteria(
    criteriaSet: CriteriaSetDocument | null,
    entityData: Record<string, unknown>,
  ): EvaluationResult {
    const criteria = criteriaSet?.criteria ?? [];
    const total_criteria = criteria.length;

    if (total_criteria === 0) {
      return { criteria_met: 0, total_criteria: 0, sq_score: 0, detail: [] };
    }

    const detail: CriterionResult[] = [];
    let criteria_met = 0;

    for (const criterion of criteria) {
      const lookupKey = criterion.field_key ?? criterion.id;
      const value = entityData[lookupKey];
      const satisfied = this.checkCriterion(criterion, value);

      if (satisfied) criteria_met++;

      detail.push({
        id: criterion.id,
        label: criterion.label,
        field_key: lookupKey,
        satisfied,
        check_type: criterion.check_type,
        value_found: value,
      });
    }

    const sq_score = Math.round((criteria_met / total_criteria) * 100);
    return { criteria_met, total_criteria, sq_score, detail };
  }

  // ── Private: check_type dispatch ──────────────────────────────────────────

  private checkCriterion(criterion: Criterion, value: unknown): boolean {
    switch (criterion.check_type) {
      case 'presence':
        return this.checkPresence(value);
      case 'min_length':
        return this.checkMinLength(value, criterion.check_value);
      case 'min_value':
        return this.checkMinValue(value, criterion.check_value);
      case 'regex':
        return this.checkRegex(value, criterion.check_value);
      default:
        // Unknown check_type — treat as presence (safe fallback)
        return this.checkPresence(value);
    }
  }

  /** presence: value is non-null, non-empty, non-zero */
  private checkPresence(value: unknown): boolean {
    if (value === undefined || value === null || value === '') return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'object') return Object.keys(value as object).length > 0;
    return false;
  }

  /** min_length: string or array length >= check_value */
  private checkMinLength(value: unknown, checkValue: string | number | null): boolean {
    if (checkValue === null || checkValue === undefined) {
      return this.checkPresence(value);
    }
    const min = Number(checkValue);
    if (isNaN(min)) return false;
    if (typeof value === 'string') return value.trim().length >= min;
    if (Array.isArray(value)) return value.length >= min;
    return false;
  }

  /** min_value: numeric value >= check_value */
  private checkMinValue(value: unknown, checkValue: string | number | null): boolean {
    if (checkValue === null || checkValue === undefined) return false;
    const min = Number(checkValue);
    const num = Number(value);
    if (isNaN(min) || isNaN(num)) return false;
    return num >= min;
  }

  /** regex: string matches the check_value pattern */
  private checkRegex(value: unknown, checkValue: string | number | null): boolean {
    if (typeof value !== 'string' || !checkValue) return false;
    try {
      const pattern = new RegExp(String(checkValue));
      return pattern.test(value);
    } catch {
      this.logger.warn(`Invalid regex pattern in criterion: "${checkValue}"`);
      return false;
    }
  }
}
