import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditWriteEvent, SQ_ENGINE_EVENTS } from '../sq-engine/sq-engine.service';
import { AuditLog, AuditLogDocument } from './audit-log.schema';

// ── Query filter types ───────────────────────────────────────────────────────

export interface AuditEntityFilter {
  platform_id?: string;
  page?: number;
  limit?: number;
}

export interface AuditUserFilter {
  platform_id?: string;
  page?: number;
  limit?: number;
}

export interface AuditPlatformFilter {
  action?: string;
  from_date?: Date;
  to_date?: Date;
  page?: number;
  limit?: number;
}

export interface AuditSearchFilter {
  action?: string;
  performed_by?: string;
  platform_id?: string;
  from_date?: Date;
  to_date?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedAuditResult {
  data: AuditLogDocument[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Audit Service
 *
 * Responsibility: Persist and query the PSS audit trail.
 *
 * Rules (from spec):
 *   - NEVER emits any events — only listens and writes
 *   - NEVER calls any other module's service
 *   - audit_log records are IMMUTABLE — no update or delete
 *   - writeLog failures are logged to console but NEVER thrown —
 *     audit failure must not break the main SQ flow
 *   - All query methods are paginated (default 50, max 200)
 *
 * Event handling:
 *   Subscribes to ALL 'audit.write' events emitted anywhere in PSS.
 *   The event payload (AuditWriteEvent) has optional structured fields
 *   (sq_level_before, sq_level_after, decided_by, metadata) that are
 *   merged and persisted in the schema's `metadata` Mixed field.
 *
 * Public API:
 *   writeLog(payload)             — called by @OnEvent and can be called directly
 *   getLogsForRequest(id)         — used by EdrService.getFullDetail
 *   getLogsForEntity(id, filter)  — entity audit history
 *   getLogsForUser(id, filter)    — user audit history
 *   getLogsForPlatform(id, filter)— platform audit dashboard
 *   search(filter)                — cross-platform search
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  private readonly DEFAULT_LIMIT = 50;
  private readonly MAX_LIMIT = 200;

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  // ── Event Listener ────────────────────────────────────────────────────────

  /**
   * Subscribes to every 'audit.write' event emitted in PSS.
   * Calls writeLog() and suppresses all errors so no audit failure
   * can propagate back into the emitter and break the main flow.
   */
  @OnEvent(SQ_ENGINE_EVENTS.AUDIT_WRITE, { async: true })
  async handleAuditWrite(event: AuditWriteEvent): Promise<void> {
    await this.writeLog(event);
  }

  // ── Core Write ────────────────────────────────────────────────────────────

  /**
   * Persists a single audit log entry.
   *
   * Merges structured fields (sq_level_before, sq_level_after, decided_by)
   * and any caller-supplied metadata into a single `metadata` object.
   * Core identity fields (sq_request_id through performed_by) are always
   * stored as top-level indexed columns.
   *
   * Never throws — errors are caught and logged to console only.
   */
  async writeLog(event: AuditWriteEvent): Promise<void> {
    try {
      // Build consolidated metadata: merge structured fields + caller metadata
      const structuredMeta: Record<string, unknown> = {};
      if (event.sq_level_before !== undefined) {
        structuredMeta['sq_level_before'] = event.sq_level_before;
      }
      if (event.sq_level_after !== undefined) {
        structuredMeta['sq_level_after'] = event.sq_level_after;
      }
      if (event.decided_by !== undefined) {
        structuredMeta['decided_by'] = event.decided_by;
      }

      const metadata: Record<string, unknown> | null =
        Object.keys(structuredMeta).length > 0 || event.metadata
          ? { ...structuredMeta, ...(event.metadata ?? {}) }
          : null;

      await this.auditLogModel.create({
        sq_request_id: event.sq_request_id,
        entity_id: event.entity_id,
        entity_type: event.entity_type,
        user_id: event.user_id,
        platform_id: event.platform_id,
        action: event.action,
        reason: event.reason,
        performed_by: event.performed_by,
        metadata,
        created_at: new Date(),
      });
    } catch (err) {
      // IMPORTANT: never rethrow — audit failure must not break the main flow
      this.logger.error(
        `writeLog FAILED for sq_request=${event.sq_request_id} action=${event.action}: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }

  // ── Query: by SQ Request ──────────────────────────────────────────────────

  /**
   * Returns the full audit trail for a single SQ request, sorted
   * chronologically (oldest first). No pagination — an individual request's
   * trail is bounded and the consumer (EdrService.getFullDetail) needs
   * the complete sequence to reconstruct the decision timeline.
   *
   * Called by EdrService.getFullDetail(sq_request_id).
   */
  async getLogsForRequest(sq_request_id: string): Promise<AuditLogDocument[]> {
    return this.auditLogModel
      .find({ sq_request_id })
      .sort({ created_at: 1 })
      .exec();
  }

  // ── Query: by Entity ─────────────────────────────────────────────────────

  /**
   * Returns all audit logs for an entity across its SQ request history.
   * Optionally filtered to a single platform.
   * Sorted most-recent-first.
   */
  async getLogsForEntity(
    entity_id: string,
    filter: AuditEntityFilter = {},
  ): Promise<PaginatedAuditResult> {
    const { platform_id, page = 1, limit: rawLimit = this.DEFAULT_LIMIT } = filter;
    const limit = Math.min(rawLimit, this.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { entity_id };
    if (platform_id) query['platform_id'] = platform_id;

    const [data, total] = await Promise.all([
      this.auditLogModel
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(query).exec(),
    ]);

    return { data, total, page, limit };
  }

  // ── Query: by User ────────────────────────────────────────────────────────

  /**
   * Returns all audit activity for a user (across all their entities).
   * Optionally filtered to a single platform.
   * Sorted most-recent-first.
   */
  async getLogsForUser(
    user_id: string,
    filter: AuditUserFilter = {},
  ): Promise<PaginatedAuditResult> {
    const { platform_id, page = 1, limit: rawLimit = this.DEFAULT_LIMIT } = filter;
    const limit = Math.min(rawLimit, this.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { user_id };
    if (platform_id) query['platform_id'] = platform_id;

    const [data, total] = await Promise.all([
      this.auditLogModel
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(query).exec(),
    ]);

    return { data, total, page, limit };
  }

  // ── Query: by Platform ────────────────────────────────────────────────────

  /**
   * Returns all audit logs for a platform with optional filters.
   * Supports action filter and date range.
   * Sorted most-recent-first.
   */
  async getLogsForPlatform(
    platform_id: string,
    filter: AuditPlatformFilter = {},
  ): Promise<PaginatedAuditResult> {
    const { action, from_date, to_date, page = 1, limit: rawLimit = this.DEFAULT_LIMIT } = filter;
    const limit = Math.min(rawLimit, this.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { platform_id };
    if (action) query['action'] = action;
    if (from_date || to_date) {
      const dateFilter: Record<string, Date> = {};
      if (from_date) dateFilter['$gte'] = from_date;
      if (to_date) dateFilter['$lte'] = to_date;
      query['created_at'] = dateFilter;
    }

    const [data, total] = await Promise.all([
      this.auditLogModel
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(query).exec(),
    ]);

    return { data, total, page, limit };
  }

  // ── Query: Cross-Platform Search ──────────────────────────────────────────

  /**
   * Cross-platform audit search. Used by EHB admins to investigate
   * decisions across all platforms at once.
   * All filter params are optional — no default platform restriction.
   */
  async search(filter: AuditSearchFilter = {}): Promise<PaginatedAuditResult> {
    const {
      action,
      performed_by,
      platform_id,
      from_date,
      to_date,
      page = 1,
      limit: rawLimit = this.DEFAULT_LIMIT,
    } = filter;
    const limit = Math.min(rawLimit, this.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (action) query['action'] = action;
    if (performed_by) query['performed_by'] = performed_by;
    if (platform_id) query['platform_id'] = platform_id;
    if (from_date || to_date) {
      const dateFilter: Record<string, Date> = {};
      if (from_date) dateFilter['$gte'] = from_date;
      if (to_date) dateFilter['$lte'] = to_date;
      query['created_at'] = dateFilter;
    }

    const [data, total] = await Promise.all([
      this.auditLogModel
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(query).exec(),
    ]);

    return { data, total, page, limit };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Clamp a raw limit query param to the valid 1–MAX_LIMIT range */
  clampLimit(raw: number | undefined, defaultVal = this.DEFAULT_LIMIT): number {
    if (!raw || raw < 1) return defaultVal;
    return Math.min(raw, this.MAX_LIMIT);
  }
}
