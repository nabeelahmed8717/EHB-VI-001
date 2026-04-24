import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { PlatformsService } from '../platforms/platforms.service';

/**
 * Extend Express Request to carry the validated platform identity.
 * Controllers can read request.platform to get the authenticated platform.
 */
declare module 'express' {
  interface Request {
    platform?: {
      platform_id: string;
      platform_name: string;
    };
  }
}

/**
 * Platform Key Guard
 *
 * Validates the x-platform-key + x-platform-id headers.
 * Called by PlatformsService.validatePlatformKey() — returns null if:
 *   - platform_id not found
 *   - api_key doesn't match
 *   - platform is suspended
 *
 * On success: attaches { platform_id, platform_name } to request.platform.
 * On failure: throws UnauthorizedException (401).
 *
 * Applied to:
 *   SqEngineController  — all endpoints (platforms submit/query SQ)
 *   WebhookController   — all endpoints (future module)
 *
 * Usage at controller level:
 *   @UseGuards(PlatformKeyGuard)
 *   @Controller('sq')
 *   export class SqEngineController { ... }
 *
 * Usage at method level (override controller guard):
 *   @UseGuards(PlatformKeyGuard)
 *   @Post('submit')
 *   async submit(...) { ... }
 */
@Injectable()
export class PlatformKeyGuard implements CanActivate {
  private readonly logger = new Logger(PlatformKeyGuard.name);

  constructor(private readonly platformsService: PlatformsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const platform_id = request.headers['x-platform-id'] as string | undefined;
    const api_key = request.headers['x-platform-key'] as string | undefined;

    if (!platform_id || !api_key) {
      throw new UnauthorizedException(
        'Missing required headers: x-platform-id and x-platform-key are required',
      );
    }

    const platform = await this.platformsService.validatePlatformKey(
      platform_id,
      api_key,
    );

    if (!platform) {
      this.logger.warn(
        `Auth failed: platform_id=${platform_id} — invalid key or suspended platform`,
      );
      throw new UnauthorizedException(
        'Invalid platform credentials or platform is suspended',
      );
    }

    // Attach validated platform identity to request for downstream use
    request.platform = {
      platform_id: platform.platform_id,
      platform_name: platform.platform_name,
    };

    return true;
  }
}
