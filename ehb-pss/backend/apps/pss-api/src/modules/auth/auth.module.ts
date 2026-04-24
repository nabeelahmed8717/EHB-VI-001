import { Module } from '@nestjs/common';
import { AdminKeyGuard } from './admin-key.guard';
import { PlatformKeyGuard } from './platform-key.guard';
import { PlatformsModule } from '../platforms/platforms.module';

/**
 * Auth Module
 *
 * Provides NestJS guards for all PSS API security layers.
 *
 * Guards:
 *   AdminKeyGuard      — validates x-ehb-admin-key vs EHB_ADMIN_KEY env var
 *                        Applied to: PlatformsController, RuleEngineController,
 *                                    CriteriaController (write endpoints),
 *                                    FranchiseController, EdrController
 *
 *   PlatformKeyGuard   — validates x-platform-id + x-platform-key headers
 *                        via PlatformsService.validatePlatformKey()
 *                        Applied to: SqEngineController, WebhookController (future)
 *                        Sets request.platform = { platform_id, platform_name }
 *
 * Dependencies:
 *   PlatformsModule — PlatformKeyGuard needs PlatformsService to validate keys
 *
 * NOTE: Guards imported directly from this module's files can also be used
 * without importing AuthModule — they are self-contained and just need to
 * be listed as providers. AuthModule exports them for convenience.
 *
 * No controller. No Mongoose models. No events.
 */
@Module({
  imports: [PlatformsModule],
  providers: [AdminKeyGuard, PlatformKeyGuard],
  exports: [AdminKeyGuard, PlatformKeyGuard, PlatformsModule],
})
export class AuthModule {}
