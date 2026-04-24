import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { Model } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { SqDecisionEvent, RULE_ENGINE_EVENTS } from '../rule-engine/rule-engine.service';
import { AuditWriteEvent, SQ_ENGINE_EVENTS } from '../sq-engine/sq-engine.service';
import { PlatformsService } from '../platforms/platforms.service';
import { WebhookDelivery, WebhookDeliveryDocument } from './webhook-delivery.schema';

// ── Queue name constant ────────────────────────────────────────────────────────

export const WEBHOOK_QUEUE = 'webhook-delivery';

// ── Job payload ───────────────────────────────────────────────────────────────

export interface WebhookJobData {
  /** MongoDB _id of the WebhookDelivery document to process */
  delivery_id: string;
}

// ── Outgoing webhook payload (pss-api-contract.md § 6) ────────────────────────

export interface PssWebhookDecisionPayload {
  event: 'sq.decision';
  sq_request_id: string;
  entity_id: string;
  entity_type: string;
  user_id: string;
  platform_id: string;
  decision: 'approved' | 'rejected';
  sq_level: number | null;
  decided_by: 'auto' | 'franchise' | 'edr';
  decided_at: string;          // ISO 8601
  rejection_reason: string | null;
}

// ── HTTP response shape ────────────────────────────────────────────────────────

interface HttpResult {
  statusCode: number;
  ok: boolean;
  body: string;
}

/**
 * Webhook Service + Bull Processor
 *
 * Responsibility:
 *   1. Listens for 'sq.decision' events (from rule-engine, franchise, edr)
 *   2. Creates a WebhookDelivery record and enqueues a Bull job
 *   3. Bull processor (@Process) executes the job:
 *      a. Loads delivery + platform webhook config
 *      b. Signs the payload with HMAC-SHA256 (x-pss-signature: sha256=<hex>)
 *      c. POSTs to the platform webhook URL (10s timeout)
 *      d. On 2xx: marks delivered, emits audit.write(webhook_delivered)
 *      e. On error: records error_message, increments attempts, emits audit.write(webhook_failed)
 *         Bull handles retry via job options (max 3 attempts, backoff: [30s, 120s, 300s])
 *
 * Bull retry configuration (set in enqueueDelivery, not in @Process):
 *   attempts: 3
 *   backoff: { type: 'custom' } with delays [30000, 120000, 300000] ms
 *   removeOnComplete: false  — keep job history for admin inspection
 *   removeOnFail: false
 *
 * HMAC signing:
 *   Uses the platform's individual webhook_secret (NOT the global PSS_WEBHOOK_SIGNING_SECRET).
 *   Each platform has its own secret from PlatformsService.getWebhookConfig().
 *   Signature covers the raw JSON body string.
 *   Header: `x-pss-signature: sha256=<hex_digest>`
 *
 * Singleton class: both @Injectable() and @Processor() on same class because
 * NestJS Bull allows a service to be both a regular provider and a queue processor.
 * The queue processor is only activated when the class is registered as a processor in the module.
 */
@Injectable()
@Processor(WEBHOOK_QUEUE)
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectModel(WebhookDelivery.name)
    private readonly deliveryModel: Model<WebhookDeliveryDocument>,

    @InjectQueue(WEBHOOK_QUEUE)
    private readonly webhookQueue: Queue<WebhookJobData>,

    private readonly platformsService: PlatformsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ── Event Listener ─────────────────────────────────────────────────────────

  /**
   * Triggered when rule-engine, franchise, or edr emits 'sq.decision'.
   *
   * Flow:
   *   1. Emit audit.write(webhook_queued) — always BEFORE state change
   *   2. Build the canonical webhook payload from the event
   *   3. Load platform webhook URL snapshot
   *   4. Upsert WebhookDelivery record (idempotent on sq_request_id)
   *   5. Enqueue Bull job with retry config
   *
   * The upsert uses $setOnInsert so a duplicate 'sq.decision' event
   * (if emitted twice) does not overwrite an in-progress delivery.
   */
  @OnEvent(RULE_ENGINE_EVENTS.DECISION, { async: true })
  async handleSqDecision(event: SqDecisionEvent): Promise<void> {
    const {
      sq_request_id,
      entity_id,
      entity_type,
      user_id,
      platform_id,
      decision,
      sq_level,
      decided_by,
      decided_at,
      rejection_reason,
    } = event;

    this.logger.log(
      `sq.decision received: sq_request=${sq_request_id} platform=${platform_id} decision=${decision}`,
    );

    try {
      // ── 1. Audit FIRST — webhook queued ──────────────────────────────────
      this.emitAuditWrite({
        sq_request_id,
        entity_id,
        entity_type,
        user_id,
        platform_id,
        action: 'webhook_queued',
        reason: `Webhook delivery queued for decision=${decision} to platform ${platform_id}.`,
        performed_by: 'system',
        metadata: { decision, sq_level, decided_by },
      });

      // ── 2. Build canonical payload ────────────────────────────────────────
      const payload: PssWebhookDecisionPayload = {
        event: 'sq.decision',
        sq_request_id,
        entity_id,
        entity_type,
        user_id,
        platform_id,
        decision,
        sq_level,
        decided_by,
        decided_at: decided_at instanceof Date ? decided_at.toISOString() : String(decided_at),
        rejection_reason,
      };

      // ── 3. Load platform webhook URL (snapshot at queue time) ─────────────
      const webhookConfig = await this.platformsService.getWebhookConfig(platform_id);
      if (!webhookConfig) {
        this.logger.warn(
          `No webhook config for platform=${platform_id}. sq_request=${sq_request_id}. ` +
          `Delivery skipped — platform may not have a webhook URL configured.`,
        );
        return;
      }

      // ── 4. Upsert WebhookDelivery — idempotent on sq_request_id ──────────
      const delivery = await this.deliveryModel.findOneAndUpdate(
        { sq_request_id },
        {
          $setOnInsert: {
            sq_request_id,
            platform_id,
            payload,
            webhook_url: webhookConfig.webhook_url,
            status: 'pending',
            attempts: 0,
            last_attempt_at: null,
            delivered_at: null,
            failed_at: null,
            error_message: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        },
        { upsert: true, new: true },
      ).exec();

      // ── 5. Enqueue Bull job with retry config ─────────────────────────────
      await this.webhookQueue.add(
        { delivery_id: String(delivery._id) },
        {
          attempts: 3,
          backoff: {
            type: 'fixed',
            delay: 30_000,   // First retry after 30s
          },
          removeOnComplete: false,
          removeOnFail: false,
          jobId: `webhook-${sq_request_id}`,   // deduplicate: same job ID = no duplicate
        },
      );

      this.logger.log(
        `Webhook job enqueued: delivery_id=${delivery._id} ` +
        `sq_request=${sq_request_id} url=${webhookConfig.webhook_url}`,
      );

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      // Redis unavailable — this is expected in dev environments without Redis.
      // The SQ decision itself was recorded successfully; webhook delivery is skipped.
      const isRedisDown =
        message.includes('MaxRetriesPerRequest') ||
        message.includes('ECONNREFUSED') ||
        message.includes('Stream isn\'t writeable') ||
        message.includes('Connection is closed');

      if (isRedisDown) {
        this.logger.warn(
          `[WebhookQueue] Redis unavailable — webhook skipped for sq_request=${sq_request_id}. ` +
          `Start Redis (redis-server or Docker) to enable webhook delivery.`,
        );
      } else {
        this.logger.error(
          `Failed to queue webhook for sq_request=${sq_request_id}: ${message}`,
          err instanceof Error ? err.stack : undefined,
        );
      }
    }
  }

  // ── Bull Processor ─────────────────────────────────────────────────────────

  /**
   * Processes a webhook delivery job.
   *
   * Called by Bull on each attempt (initial + up to 2 retries).
   * Uses Bull's built-in retry: if this method throws, Bull will
   * re-enqueue the job after the configured backoff delay.
   *
   * Custom retry delays (30s → 120s → 300s):
   *   Bull's fixed backoff uses the same delay every time.
   *   To get escalating delays we check job.attemptsMade and
   *   apply a manual delay before re-throwing. Bull still owns
   *   the retry loop; we just control the timing via backoff.
   *
   * Flow:
   *   1. Load WebhookDelivery document
   *   2. Load platform webhook config (URL + secret)
   *   3. Sign payload with HMAC-SHA256
   *   4. POST to platform with 10s timeout
   *   5a. 2xx → mark delivered, emit audit.write(webhook_delivered)
   *   5b. non-2xx / error → update error_message, emit audit.write(webhook_failed), throw to trigger retry
   */
  @Process()
  async processWebhookJob(job: Job<WebhookJobData>): Promise<void> {
    const { delivery_id } = job.data;
    const attemptsMade = job.attemptsMade ?? 0;

    this.logger.log(
      `Processing webhook job: delivery_id=${delivery_id} attempt=${attemptsMade + 1}`,
    );

    // ── 1. Load delivery document ─────────────────────────────────────────
    const delivery = await this.deliveryModel.findById(delivery_id).exec();
    if (!delivery) {
      this.logger.error(`WebhookDelivery not found: delivery_id=${delivery_id}. Dropping job.`);
      return; // Don't retry — delivery record is gone
    }

    // Skip if already delivered (idempotency guard)
    if (delivery.status === 'delivered') {
      this.logger.log(`Delivery already complete: delivery_id=${delivery_id}. Skipping.`);
      return;
    }

    // ── 2. Load platform webhook config ───────────────────────────────────
    const webhookConfig = await this.platformsService.getWebhookConfig(delivery.platform_id);
    if (!webhookConfig) {
      this.logger.error(
        `Platform webhook config missing for platform=${delivery.platform_id}. ` +
        `delivery_id=${delivery_id}. Dropping job.`,
      );
      await this.markFailed(delivery, 'Platform webhook config not found — platform may be deregistered.');
      this.emitAuditWriteFromDelivery(delivery, 'webhook_failed', 'Platform webhook config not found.');
      return;
    }

    // ── 3. Sign the payload ───────────────────────────────────────────────
    const bodyStr = JSON.stringify(delivery.payload);
    const signature = this.signPayload(bodyStr, webhookConfig.webhook_secret);

    // ── 4. POST to platform webhook URL (10s timeout) ─────────────────────
    // Mark as retrying (so status is accurate on intermediate attempts)
    const newStatus = attemptsMade > 0 ? 'retrying' : 'pending';
    await this.deliveryModel.findByIdAndUpdate(delivery_id, {
      status: newStatus,
      attempts: attemptsMade + 1,
      last_attempt_at: new Date(),
      updated_at: new Date(),
    }).exec();

    let result: HttpResult;
    try {
      result = await this.postWithTimeout(delivery.webhook_url, bodyStr, signature, 10_000);
    } catch (networkErr) {
      const message = networkErr instanceof Error ? networkErr.message : String(networkErr);
      this.logger.warn(
        `Network error for delivery_id=${delivery_id} attempt=${attemptsMade + 1}: ${message}`,
      );
      await this.deliveryModel.findByIdAndUpdate(delivery_id, {
        error_message: `Network error: ${message}`,
        updated_at: new Date(),
      }).exec();

      // Custom escalating backoff: 30s → 120s → 300s
      const delay = this.getRetryDelay(attemptsMade);
      this.logger.log(`Retry delay for attempt ${attemptsMade + 1}: ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));

      throw networkErr; // Re-throw so Bull marks job as failed and schedules retry
    }

    // ── 5a. 2xx → success ─────────────────────────────────────────────────
    if (result.ok) {
      await this.deliveryModel.findByIdAndUpdate(delivery_id, {
        status: 'delivered',
        delivered_at: new Date(),
        error_message: null,
        updated_at: new Date(),
      }).exec();

      this.emitAuditWriteFromDelivery(
        delivery,
        'webhook_delivered',
        `Webhook delivered successfully to ${delivery.webhook_url} (HTTP ${result.statusCode}).`,
      );

      this.logger.log(
        `Webhook delivered: delivery_id=${delivery_id} ` +
        `sq_request=${delivery.sq_request_id} status=${result.statusCode}`,
      );
      return;
    }

    // ── 5b. Non-2xx → failure ─────────────────────────────────────────────
    const errorMsg = `HTTP ${result.statusCode}: ${result.body.substring(0, 200)}`;
    this.logger.warn(
      `Webhook non-2xx: delivery_id=${delivery_id} attempt=${attemptsMade + 1} ` +
      `status=${result.statusCode}`,
    );

    await this.deliveryModel.findByIdAndUpdate(delivery_id, {
      error_message: errorMsg,
      updated_at: new Date(),
    }).exec();

    // If this is the final attempt, mark as permanently failed
    const maxAttempts = job.opts.attempts ?? 3;
    if (attemptsMade + 1 >= maxAttempts) {
      await this.markFailed(delivery, errorMsg);
      this.emitAuditWriteFromDelivery(
        delivery,
        'webhook_failed',
        `Webhook delivery failed after ${maxAttempts} attempts. Last error: ${errorMsg}`,
      );
    }

    // Escalating delay before Bull retry
    const delay = this.getRetryDelay(attemptsMade);
    await new Promise(resolve => setTimeout(resolve, delay));

    // Throw to let Bull retry the job
    throw new Error(`Webhook delivery failed: ${errorMsg}`);
  }

  // ── Public Query Methods ───────────────────────────────────────────────────

  /**
   * Returns all delivery records for a platform, sorted most-recent-first.
   * Used by GET /webhooks/deliveries/:platform_id
   */
  async getDeliveriesForPlatform(
    platform_id: string,
    limit = 50,
  ): Promise<WebhookDeliveryDocument[]> {
    return this.deliveryModel
      .find({ platform_id })
      .sort({ created_at: -1 })
      .limit(Math.min(limit, 200))
      .exec();
  }

  /**
   * Returns the single delivery record for a specific SQ request.
   * Used by GET /webhooks/delivery/:sq_request_id
   */
  async getDeliveryBySqRequestId(
    sq_request_id: string,
  ): Promise<WebhookDeliveryDocument | null> {
    return this.deliveryModel.findOne({ sq_request_id }).exec();
  }

  /**
   * Enqueues a test ping job to a platform's webhook URL.
   * Useful for admins to verify connectivity after configuration changes.
   * Does NOT create a WebhookDelivery record — this is a raw test POST.
   */
  async sendTestPing(platform_id: string): Promise<{ ok: boolean; status: number; message: string }> {
    const webhookConfig = await this.platformsService.getWebhookConfig(platform_id);
    if (!webhookConfig) {
      return { ok: false, status: 0, message: `No webhook config found for platform=${platform_id}` };
    }

    const testPayload = {
      event: 'sq.test_ping',
      platform_id,
      message: 'PSS webhook connectivity test',
      sent_at: new Date().toISOString(),
    };
    const bodyStr = JSON.stringify(testPayload);
    const signature = this.signPayload(bodyStr, webhookConfig.webhook_secret);

    try {
      const result = await this.postWithTimeout(webhookConfig.webhook_url, bodyStr, signature, 10_000);
      return {
        ok: result.ok,
        status: result.statusCode,
        message: result.ok
          ? `Test ping delivered to ${webhookConfig.webhook_url} (HTTP ${result.statusCode})`
          : `Test ping returned HTTP ${result.statusCode}: ${result.body.substring(0, 200)}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, status: 0, message: `Network error: ${message}` };
    }
  }

  // ── Private: HMAC Signing ──────────────────────────────────────────────────

  /**
   * Signs the raw JSON body string with the platform's webhook_secret.
   * Returns the value to use in the x-pss-signature header.
   *
   * Header format: `sha256=<hex_digest>`
   * Compatible with GitHub-style webhook verification.
   */
  private signPayload(body: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body, 'utf8');
    return `sha256=${hmac.digest('hex')}`;
  }

  // ── Private: HTTP POST ────────────────────────────────────────────────────

  /**
   * Makes an HTTP/HTTPS POST request to the given URL with a timeout.
   * Uses Node.js built-in http/https modules — no external dependencies.
   *
   * Headers set on every request:
   *   Content-Type: application/json
   *   x-pss-signature: sha256=<hmac_hex>
   *   User-Agent: EHB-PSS/1.0
   *
   * Returns { statusCode, ok (2xx), body } or throws on network error / timeout.
   */
  private postWithTimeout(
    webhookUrl: string,
    body: string,
    signature: string,
    timeoutMs: number,
  ): Promise<HttpResult> {
    return new Promise((resolve, reject) => {
      let parsed: URL;
      try {
        parsed = new URL(webhookUrl);
      } catch {
        return reject(new Error(`Invalid webhook URL: ${webhookUrl}`));
      }

      const isHttps = parsed.protocol === 'https:';
      const transport = isHttps ? https : http;

      const options = {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body, 'utf8'),
          'x-pss-signature': signature,
          'User-Agent': 'EHB-PSS/1.0',
        },
        timeout: timeoutMs,
      };

      const req = transport.request(options, (res) => {
        let responseBody = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => { responseBody += chunk; });
        res.on('end', () => {
          const statusCode = res.statusCode ?? 0;
          resolve({
            statusCode,
            ok: statusCode >= 200 && statusCode < 300,
            body: responseBody,
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timed out after ${timeoutMs}ms`));
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(body, 'utf8');
      req.end();
    });
  }

  // ── Private: Helpers ──────────────────────────────────────────────────────

  /** Returns escalating retry delay: attempt 0→30s, 1→120s, 2+→300s */
  private getRetryDelay(attemptsMade: number): number {
    const DELAYS = [30_000, 120_000, 300_000];
    return DELAYS[Math.min(attemptsMade, DELAYS.length - 1)];
  }

  /** Updates a delivery document to status=failed */
  private async markFailed(
    delivery: WebhookDeliveryDocument,
    errorMessage: string,
  ): Promise<void> {
    await this.deliveryModel.findByIdAndUpdate(delivery._id, {
      status: 'failed',
      failed_at: new Date(),
      error_message: errorMessage,
      updated_at: new Date(),
    }).exec();
  }

  /** Emits audit.write using identity context from a delivery document */
  private emitAuditWriteFromDelivery(
    delivery: WebhookDeliveryDocument,
    action: 'webhook_queued' | 'webhook_delivered' | 'webhook_failed',
    reason: string,
  ): void {
    const payload = delivery.payload as unknown as PssWebhookDecisionPayload;
    this.emitAuditWrite({
      sq_request_id: delivery.sq_request_id,
      entity_id: payload.entity_id ?? 'unknown',
      entity_type: payload.entity_type ?? 'unknown',
      user_id: payload.user_id ?? 'unknown',
      platform_id: delivery.platform_id,
      action,
      reason,
      performed_by: 'system',
      metadata: {
        delivery_id: String(delivery._id),
        webhook_url: delivery.webhook_url,
        attempts: delivery.attempts,
      },
    });
  }

  /** Emit an audit.write event via EventEmitter2 */
  private emitAuditWrite(payload: AuditWriteEvent): void {
    this.eventEmitter.emit(SQ_ENGINE_EVENTS.AUDIT_WRITE, payload);
  }
}
