import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

export interface EhbJwtPayload {
  /** EHB user ObjectId */
  sub: string;
  email: string;
  /** Must match user.token_version in DB — incremented on logout to revoke all tokens */
  token_version?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: EhbJwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }
    // Revocation check — token issued before logout is rejected
    const currentVersion = user.token_version ?? 0;
    const payloadVersion = payload.token_version ?? 0;
    if (payloadVersion !== currentVersion) {
      throw new UnauthorizedException('Token has been revoked. Please log in again.');
    }
    return user;
  }
}
