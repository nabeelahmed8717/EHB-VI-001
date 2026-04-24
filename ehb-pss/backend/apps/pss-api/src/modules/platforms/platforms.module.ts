import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlatformsController } from './platforms.controller';
import { PlatformsService } from './platforms.service';
import { Platform, PlatformSchema } from './platform.schema';

/**
 * Platforms Module
 *
 * Manages platform registration, API key issuance, and webhook config.
 *
 * MongoDB collection: platforms
 *
 * Exports PlatformsService so:
 *   AuthModule (PlatformKeyGuard) → validatePlatformKey(platform_id, api_key)
 *   WebhookModule (future)        → getWebhookConfig(platform_id)
 *   Other modules                 → getPlatform(platform_id)
 *
 * No events emitted. No dependencies on other PSS modules.
 * All controller endpoints protected by AdminKeyGuard (applied at controller level).
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Platform.name, schema: PlatformSchema },
    ]),
  ],
  controllers: [PlatformsController],
  providers: [PlatformsService],
  exports: [PlatformsService],
})
export class PlatformsModule {}
