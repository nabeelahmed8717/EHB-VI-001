import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Validates requests from sub-platform backends.
 * Platforms send their PSS API key via `x-platform-key` header.
 * EHB validates this key against the ALLOWED_PLATFORM_KEYS env var.
 */
@Injectable()
export class PlatformKeyGuard implements CanActivate {
  private readonly allowedKeys: Set<string>;

  constructor(private readonly config: ConfigService) {
    const raw = this.config.get<string>('ALLOWED_PLATFORM_KEYS', '');
    this.allowedKeys = new Set(
      raw
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.headers['x-platform-key'];

    if (!key || typeof key !== 'string' || !this.allowedKeys.has(key)) {
      throw new UnauthorizedException('Invalid or missing platform key');
    }
    return true;
  }
}
