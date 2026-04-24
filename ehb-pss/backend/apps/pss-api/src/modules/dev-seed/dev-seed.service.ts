import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PlatformsService } from '../platforms/platforms.service';

/**
 * DevSeedService
 *
 * Ensures GoSellr (and any future sub-platform) is registered in PSS
 * with a known fixed API key so local development works without manual setup.
 *
 * Runs once on every PSS startup via OnModuleInit.
 * Safe to call repeatedly — uses upsert-style logic (idempotent).
 *
 * To add another platform:  append an entry to DEV_PLATFORMS below and
 * set the matching PSS_PLATFORM_KEY in that platform's .env.
 */
@Injectable()
export class DevSeedService implements OnModuleInit {
  private readonly logger = new Logger(DevSeedService.name);

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
  ];

  constructor(private readonly platformsService: PlatformsService) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Running dev platform seed…');
    for (const p of this.DEV_PLATFORMS) {
      try {
        const existing = await this.platformsService.getPlatform(p.platform_id);
        if (existing) {
          // Overwrite key + status in case a previous run used a random key
          await this.platformsService.forceSetDevKey(
            p.platform_id,
            p.api_key,
            p.webhook_url,
            p.webhook_secret,
          );
          this.logger.log(`Dev seed: synced ${p.platform_id} (key=fixed, status=active)`);
        } else {
          await this.platformsService.registerDevPlatform(p);
          this.logger.log(`Dev seed: registered ${p.platform_id}`);
        }
      } catch (err: unknown) {
        // Non-fatal: log and continue — PSS still starts up
        this.logger.warn(`Dev seed failed for ${p.platform_id}: ${String(err)}`);
      }
    }
    this.logger.log('Dev platform seed complete');
  }
}
