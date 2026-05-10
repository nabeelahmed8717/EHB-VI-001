import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Guards endpoints that are called server-to-server by other EHB platforms
 * (e.g. GoSellr fetching a buyer-safe view of a JPS profile).
 *
 * Auth model:
 *   Header: x-service-key: <shared secret>
 *   Header: x-service-id : <calling platform id, e.g. "gosellr"> (informational)
 *
 * The shared secret is read from JPS_SERVICE_KEY (set in .env).
 * If JPS_SERVICE_KEY is missing the guard refuses ALL traffic — fail closed.
 */
@Injectable()
export class ServiceKeyGuard implements CanActivate {
  private readonly logger = new Logger(ServiceKeyGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.header('x-service-key');
    const expected = this.config.get<string>('JPS_SERVICE_KEY');

    if (!expected) {
      this.logger.error(
        'JPS_SERVICE_KEY is not configured — rejecting service-to-service request',
      );
      throw new UnauthorizedException('Service auth not configured');
    }

    if (!provided || provided !== expected) {
      const callerId = req.header('x-service-id') ?? 'unknown';
      this.logger.warn(
        `ServiceKeyGuard rejected request from "${callerId}" at ${req.path}`,
      );
      throw new UnauthorizedException('Invalid service key');
    }

    return true;
  }
}
