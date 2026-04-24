import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { generatePlatformKey, generateWebhookSecret } from '@ehb-pss/utils';
import { Platform, PlatformDocument, PlatformStatus } from './platform.schema';

// ── Output types for registration (key shown once) ───────────────────────────

export interface PlatformRegistrationResult {
  platform_id: string;
  platform_name: string;
  api_key: string;           // Plaintext — returned ONCE, not re-readable
  webhook_secret: string;    // Plaintext — returned ONCE, not re-readable
  status: PlatformStatus;
  message: string;
}

export interface WebhookConfig {
  webhook_url: string;
  webhook_secret: string;
}

/**
 * Platforms Service
 *
 * Manages platform registration, API key issuance, and webhook config.
 *
 * Key exported methods (used by other modules):
 *   validatePlatformKey(platform_id, api_key)   ← called by PlatformKeyGuard
 *   getPlatform(platform_id)                     ← called by other modules
 *   getWebhookConfig(platform_id)                ← called by webhook module
 *
 * Security note:
 *   api_key and webhook_secret are stored in plaintext in this phase.
 *   Production hardening will hash api_key with bcrypt before storing,
 *   returning the plaintext once on registration only.
 *
 * Architecture:
 *   - No events emitted
 *   - No dependencies on other PSS modules
 */
@Injectable()
export class PlatformsService {
  private readonly logger = new Logger(PlatformsService.name);

  constructor(
    @InjectModel(Platform.name)
    private readonly platformModel: Model<PlatformDocument>,
  ) {}

  // ── Registration ──────────────────────────────────────────────────────────

  /**
   * Registers a new platform with PSS.
   * Generates api_key (pk_{platform_id}_{random}) and webhook_secret (whsec_{random}).
   * Both keys are returned in plaintext exactly once — they cannot be retrieved again.
   * (In production: hash api_key before storing.)
   */
  async registerPlatform(input: {
    platform_id: string;
    platform_name: string;
    webhook_url: string;
    entity_types: string[];
    contact_email: string;
  }): Promise<PlatformRegistrationResult> {
    const existing = await this.platformModel
      .findOne({ platform_id: input.platform_id })
      .exec();

    if (existing) {
      throw new ConflictException(
        `Platform with platform_id="${input.platform_id}" is already registered.`,
      );
    }

    const api_key = generatePlatformKey(input.platform_id);
    const webhook_secret = generateWebhookSecret();

    await this.platformModel.create({
      platform_id: input.platform_id,
      platform_name: input.platform_name,
      api_key,
      webhook_url: input.webhook_url,
      webhook_secret,
      entity_types: input.entity_types,
      contact_email: input.contact_email,
      status: 'pending',
    });

    this.logger.log(
      `Platform registered: platform_id=${input.platform_id} status=pending`,
    );

    return {
      platform_id: input.platform_id,
      platform_name: input.platform_name,
      api_key,
      webhook_secret,
      status: 'pending',
      message:
        'Platform registered. Store api_key and webhook_secret securely — ' +
        'they cannot be retrieved again. Activate the platform via ' +
        'PATCH /platforms/:platform_id/status.',
    };
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  /** Returns all platforms (admin list endpoint) */
  async getAllPlatforms(): Promise<PlatformDocument[]> {
    return this.platformModel.find().sort({ registered_at: -1 }).exec();
  }

  /**
   * Returns a single platform by platform_id.
   * Used by other modules (webhook, etc.) and the admin detail endpoint.
   */
  async getPlatform(platform_id: string): Promise<PlatformDocument | null> {
    return this.platformModel.findOne({ platform_id }).exec();
  }

  /**
   * Returns webhook URL and signing secret for a platform.
   * Called by the webhook module when pushing sq.decision events.
   */
  async getWebhookConfig(platform_id: string): Promise<WebhookConfig | null> {
    const platform = await this.platformModel
      .findOne({ platform_id, status: 'active' })
      .select('webhook_url webhook_secret')
      .exec();

    if (!platform) return null;
    return {
      webhook_url: platform.webhook_url,
      webhook_secret: platform.webhook_secret,
    };
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  /**
   * Validates a platform API key.
   * Called by PlatformKeyGuard on every platform-authenticated request.
   * Returns the platform document if valid and active; null otherwise.
   *
   * Checks:
   *   1. platform_id + api_key match a record
   *   2. platform status is 'active' (suspended platforms are rejected)
   */
  async validatePlatformKey(
    platform_id: string,
    api_key: string,
  ): Promise<PlatformDocument | null> {
    return this.platformModel
      .findOne({ platform_id, api_key, status: 'active' })
      .exec();
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  /** Updates the webhook URL for a platform */
  async updateWebhookUrl(
    platform_id: string,
    webhook_url: string,
  ): Promise<PlatformDocument> {
    const updated = await this.platformModel
      .findOneAndUpdate({ platform_id }, { webhook_url }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Platform "${platform_id}" not found`);
    }

    this.logger.log(`Webhook URL updated: platform_id=${platform_id}`);
    return updated;
  }

  /** Activates or suspends a platform */
  async updateStatus(
    platform_id: string,
    status: PlatformStatus,
  ): Promise<PlatformDocument> {
    const updated = await this.platformModel
      .findOneAndUpdate({ platform_id }, { status }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Platform "${platform_id}" not found`);
    }

    this.logger.log(`Platform status updated: platform_id=${platform_id} status=${status}`);
    return updated;
  }

  // ── Dev / Seed helpers (non-production only) ─────────────────────────────

  /**
   * Register a platform with a fixed known key (for dev seeding).
   * Skips the random key generation used in registerPlatform().
   * Sets status=active so the platform can call PSS immediately.
   */
  async registerDevPlatform(input: {
    platform_id: string;
    platform_name: string;
    api_key: string;
    webhook_url: string;
    webhook_secret: string;
    entity_types: string[];
    contact_email: string;
  }): Promise<void> {
    await this.platformModel.create({
      ...input,
      status: 'active',
    });
  }

  /**
   * Overwrite the API key and webhook config for an existing platform
   * and ensure status=active. Used by dev seed to fix up records that
   * were previously registered with a random generated key.
   */
  async forceSetDevKey(
    platform_id: string,
    api_key: string,
    webhook_url: string,
    webhook_secret: string,
  ): Promise<void> {
    await this.platformModel.findOneAndUpdate(
      { platform_id },
      { $set: { api_key, webhook_url, webhook_secret, status: 'active' } },
    ).exec();
  }

  /**
   * Rotates the API key for a platform.
   * Generates a new key, overwrites the old one immediately.
   * Old key is invalidated the moment this call succeeds.
   * Returns the new key in plaintext — cannot be retrieved again.
   */
  async rotateApiKey(platform_id: string): Promise<{ api_key: string; message: string }> {
    const platform = await this.platformModel
      .findOne({ platform_id })
      .exec();

    if (!platform) {
      throw new NotFoundException(`Platform "${platform_id}" not found`);
    }

    const new_api_key = generatePlatformKey(platform_id);

    await this.platformModel.findOneAndUpdate(
      { platform_id },
      { api_key: new_api_key },
    );

    this.logger.log(`API key rotated: platform_id=${platform_id}`);

    return {
      api_key: new_api_key,
      message:
        'API key rotated. The old key is immediately invalid. ' +
        'Store the new key securely — it cannot be retrieved again.',
    };
  }
}
