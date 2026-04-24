import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type PlatformDocument = HydratedDocument<Platform>;

export type PlatformStatus = 'active' | 'suspended' | 'pending';

/**
 * Platform Schema — pss_db.platforms
 *
 * Represents a registered sub-platform (GoSellr, OLS, HPS, etc.).
 * Platforms call POST /platforms/register once during onboarding.
 * PSS issues them an api_key and webhook_secret on registration.
 *
 * api_key is used by the platform to authenticate all PSS API calls
 * via the x-platform-key header.
 *
 * webhook_secret is used by PSS to sign outgoing webhook payloads;
 * platforms verify the signature to confirm the call came from PSS.
 */
@Schema({
  timestamps: { createdAt: 'registered_at', updatedAt: 'updated_at' },
  collection: 'platforms',
})
export class Platform {
  // ── Identity ──────────────────────────────────────────────────────────────

  @ApiProperty({
    description: 'Short identifier for the platform. Unique, lowercase, no spaces.',
    example: 'gosellr',
  })
  @Prop({ required: true, unique: true, index: true })
  platform_id: string;

  @ApiProperty({ description: 'Human-readable display name', example: 'GoSellr' })
  @Prop({ required: true })
  platform_name: string;

  // ── Auth ──────────────────────────────────────────────────────────────────

  @ApiProperty({
    description:
      'Generated API key issued on registration. ' +
      'Returned once — not re-readable after registration (stored in plaintext for now; ' +
      'hash before storing in production hardening phase).',
    example: 'pk_gosellr_abc123...',
  })
  @Prop({ required: true, unique: true })
  api_key: string;

  // ── Webhook Config ────────────────────────────────────────────────────────

  @ApiProperty({
    description: 'URL where PSS pushes sq.decision events via POST',
    example: 'https://api.gosellr.com/pss/webhook',
  })
  @Prop({ required: true })
  webhook_url: string;

  @ApiProperty({
    description:
      'HMAC signing secret for webhook payloads. ' +
      'PSS signs every webhook call with this; platforms verify on receipt.',
    example: 'whsec_abc123...',
  })
  @Prop({ required: true })
  webhook_secret: string;

  // ── Platform Config ───────────────────────────────────────────────────────

  @ApiProperty({
    description: 'Entity types this platform submits for SQ scoring',
    example: ['product', 'seller_profile'],
    type: [String],
  })
  @Prop({ type: [String], default: [] })
  entity_types: string[];

  @ApiProperty({
    description: 'Contact email for platform admin communications',
    example: 'tech@gosellr.com',
  })
  @Prop({ required: true })
  contact_email: string;

  // ── Status ────────────────────────────────────────────────────────────────

  @ApiProperty({
    enum: ['active', 'suspended', 'pending'],
    description:
      'active    — platform is operational; API key valid; webhooks sent. ' +
      'suspended — API key rejected; webhooks paused. ' +
      'pending   — registered but not yet activated by EHB admin.',
    example: 'active',
  })
  @Prop({
    type: String,
    enum: ['active', 'suspended', 'pending'],
    default: 'pending',
    index: true,
  })
  status: PlatformStatus;

  // Timestamps (auto-managed by Mongoose; mapped to registered_at / updated_at)
  registered_at: Date;
  updated_at: Date;
}

export const PlatformSchema = SchemaFactory.createForClass(Platform);

// ── Indexes ───────────────────────────────────────────────────────────────────

/** Key auth lookup: validatePlatformKey() queries by (platform_id, api_key) */
PlatformSchema.index({ platform_id: 1, api_key: 1 });

/** Admin dashboard: list by status */
PlatformSchema.index({ status: 1 });
