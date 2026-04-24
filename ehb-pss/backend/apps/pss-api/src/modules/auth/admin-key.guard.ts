import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Admin Key Guard
 *
 * Validates the x-ehb-admin-key header against process.env.EHB_ADMIN_KEY.
 *
 * Applied to:
 *   PlatformsController    — all endpoints
 *   RuleEngineController   — all endpoints
 *   CriteriaController     — POST, PATCH, DELETE (write endpoints only)
 *   FranchiseController    — all endpoints
 *   EdrController          — all endpoints
 *   AuditController        — all endpoints (optional — spec leaves unguarded for now)
 *
 * Usage:
 *   @UseGuards(AdminKeyGuard)
 *
 * Or at controller level:
 *   @UseGuards(AdminKeyGuard)
 *   @Controller('platforms')
 *   export class PlatformsController { ... }
 */
@Injectable()
export class AdminKeyGuard implements CanActivate {
  private readonly logger = new Logger(AdminKeyGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.headers['x-ehb-admin-key'] as string | undefined;

    const expectedKey = process.env['EHB_ADMIN_KEY'];

    if (!expectedKey) {
      // Misconfiguration — guard fails closed (deny all) rather than open
      this.logger.error(
        'EHB_ADMIN_KEY is not set in environment. AdminKeyGuard will deny all requests.',
      );
      throw new UnauthorizedException('Server configuration error — admin key not set');
    }

    if (!providedKey || providedKey !== expectedKey) {
      throw new UnauthorizedException(
        'Invalid or missing x-ehb-admin-key header',
      );
    }

    return true;
  }
}
