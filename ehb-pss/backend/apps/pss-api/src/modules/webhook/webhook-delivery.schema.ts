import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type WebhookDeliveryDocument = HydratedDocument<WebhookDelivery>;

export type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying';

export const DELIVERY_STATUSES: DeliveryStatus[] = [
  'pending',
  'delivered',
  'failed',
  'retrying',
];

/**
 * Webhook Delivery Schema — pss_db.webhook_deliveries
 *
 * Tracks every outgoing webhook attempt PSS makes to a platform.
 * One document per sq.decision event — updated in place as Bull
 * retries the job (status: pending → retrying → delivered | failed).
 *
 * Architecture rules:
 *   - Created by WebhookService when 'sq.decision' is received
 *   - Updated by WebhookProcessor after each delivery attempt
 *   - Immutable once status=delivered
 *   - `webhook_url` is a snapshot of the platform URL at creation time
 *     so later URL changes don't retroactively alter history
 *   - `payload` stores the full JSON sent to the platform (Mixed for flexibility)
 */
@Schema({
  timestamps: false,
  collection: 'webhook_deliveries',
})
export class WebhookDelivery {
  // ── SQ Request Context ────────────────────────────────────────────────────

  @ApiProperty({
    description: 'SQ request this delivery is for',
    example: '665f1e2a4b3c2a1d0e9f8b7a',
  })
  @Prop({ required: true, index: true })
  sq_request_id: string;

  @ApiProperty({
    description: 'Platform that submitted the entity and receives this webhook',
    example: 'gosellr',
  })
  @Prop({ required: true, index: true })
  platform_id: string;

  // ── Delivery Payload ──────────────────────────────────────────────────────

  @ApiProperty({
    description:
      'Full webhook payload sent to the platform — snapshot of the sq.decision event. ' +
      'Stored so PSS admins can replay or audit exactly what was sent.',
    example: {
      event: 'sq.decision',
      sq_request_id: '665f1e2a4b3c2a1d0e9f8b7a',
      entity_id: 'prod_abc123',
      user_id: 'usr_456',
      platform_id: 'gosellr',
      decision: 'approved',
      sq_level: 5,
      decided_by: 'auto',
      decided_at: '2024-01-01T12:00:00.000Z',
      rejection_reason: null,
    },
  })
  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  payload: Record<string, unknown>;

  @ApiProperty({
    description:
      'Snapshot of the platform webhook URL at the time of delivery creation. ' +
      'Preserved so history is not affected by later URL changes.',
    example: 'https://api.gosellr.com/webhooks/pss',
  })
  @Prop({ required: true })
  webhook_url: string;

  // ── Delivery State ────────────────────────────────────────────────────────

  @ApiProperty({
    enum: DELIVERY_STATUSES,
    description:
      'Current delivery state. ' +
      'pending → queued but not yet attempted; ' +
      'retrying → failed at least once, more attempts remain; ' +
      'delivered → platform returned 2xx; ' +
      'failed → all retries exhausted.',
    example: 'pending',
  })
  @Prop({ required: true, enum: DELIVERY_STATUSES, default: 'pending', index: true })
  status: DeliveryStatus;

  @ApiProperty({
    description: 'Total number of delivery attempts made so far (0 = not yet attempted)',
    example: 0,
  })
  @Prop({ required: true, default: 0 })
  attempts: number;

  @ApiPropertyOptional({
    description: 'Timestamp of the most recent delivery attempt (null if never attempted)',
    nullable: true,
    example: '2024-01-01T12:00:30.000Z',
  })
  @Prop({ type: Date, default: null })
  last_attempt_at: Date | null;

  @ApiPropertyOptional({
    description: 'Timestamp when platform returned a 2xx — null until delivered',
    nullable: true,
    example: '2024-01-01T12:00:31.200Z',
  })
  @Prop({ type: Date, default: null })
  delivered_at: Date | null;

  @ApiPropertyOptional({
    description: 'Timestamp when all retries were exhausted — null until failed',
    nullable: true,
    example: null,
  })
  @Prop({ type: Date, default: null })
  failed_at: Date | null;

  @ApiPropertyOptional({
    description:
      'Error message from the last failed attempt. ' +
      'Populated on non-2xx responses or connection errors. ' +
      'Overwritten on each retry so reflects the most recent failure.',
    nullable: true,
    example: 'HTTP 503: Service Unavailable',
  })
  @Prop({ type: String, default: null })
  error_message: string | null;

  // ── Timestamps ────────────────────────────────────────────────────────────

  @ApiProperty({
    description: 'When this delivery record was created (first saw the sq.decision event)',
  })
  @Prop({ required: true, default: () => new Date() })
  created_at: Date;

  @ApiProperty({ description: 'Last time this record was updated (attempt or status change)' })
  @Prop({ required: true, default: () => new Date() })
  updated_at: Date;
}

export const WebhookDeliverySchema = SchemaFactory.createForClass(WebhookDelivery);

// ── Indexes ───────────────────────────────────────────────────────────────────

/**
 * Primary lookup: delivery record for a specific SQ request (one per request).
 * GET /webhooks/delivery/:sq_request_id
 */
WebhookDeliverySchema.index({ sq_request_id: 1 }, { unique: true });

/**
 * Platform delivery dashboard — list all deliveries for a platform, most recent first.
 * GET /webhooks/deliveries/:platform_id
 */
WebhookDeliverySchema.index({ platform_id: 1, created_at: -1 });

/**
 * Failed/retrying deliveries admin dashboard — PSS admins monitor undelivered webhooks.
 */
WebhookDeliverySchema.index({ status: 1, created_at: -1 });
